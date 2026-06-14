#!/usr/bin/env node
/**
 * Usage: ANTHROPIC_API_KEY=sk-... node scripts/generate-bank-from-pdf.js <pdf-path> [num-questions] [--pages N-M]
 * Example: node scripts/generate-bank-from-pdf.js ./strayer-ch4.pdf 20 --pages 1-30
 *
 * Requires poppler for pdftoppm:
 *   macOS:  brew install poppler
 *   Ubuntu: sudo apt install poppler-utils
 *
 * Outputs:
 *   public/images/<slug>/page-NNN.png  — one image per extracted PDF page
 *   src/banks/<slug>.jsonl             — question bank
 */

import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, readFileSync, mkdirSync, readdirSync, existsSync } from 'fs'
import { join, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── Args ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
if (!args[0]) {
  console.error('Usage: node scripts/generate-bank-from-pdf.js <pdf-path> [num-questions] [--pages N-M]')
  process.exit(1)
}

const pdfPath = args[0]
let numQuestions = 15
let firstPage = null, lastPage = null

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--pages' && args[i + 1]) {
    const parts = args[i + 1].split('-').map(Number)
    firstPage = parts[0]
    lastPage = parts[1] ?? parts[0]
    i++
  } else if (!isNaN(Number(args[i]))) {
    numQuestions = Number(args[i])
  }
}

if (!existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`)
  process.exit(1)
}

// ── Check pdfimages ───────────────────────────────────────────────────────────

try {
  execSync('which pdfimages', { stdio: 'pipe' })
} catch {
  console.error(
    'pdfimages not found. Install poppler:\n' +
    '  macOS:  brew install poppler\n' +
    '  Ubuntu: sudo apt install poppler-utils'
  )
  process.exit(1)
}

// ── Setup ─────────────────────────────────────────────────────────────────────

const slug = basename(pdfPath, extname(pdfPath))
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '')

const imgDir = join(ROOT, 'public', 'images', slug)
mkdirSync(imgDir, { recursive: true })

// ── Extract embedded images ───────────────────────────────────────────────────

console.log(`Scanning embedded images in ${pdfPath}...`)

const pageFlags = [
  firstPage != null ? `-f ${firstPage}` : '',
  lastPage  != null ? `-l ${lastPage}`  : '',
].filter(Boolean).join(' ')

// List images first to get page→num metadata (no files written with -list)
const listOutput = execSync(`pdfimages -list ${pageFlags} "${pdfPath}"`, { encoding: 'utf8' })

// Parse: data rows start with whitespace+digit; skip headers/separators/warnings
// Filter out small decorative images (borders, dividers) — keep anything ≥150px in both dimensions
const imgMeta = listOutput.split('\n')
  .filter(line => /^\s+\d/.test(line))
  .map(line => {
    const parts = line.trim().split(/\s+/)
    return { page: parseInt(parts[0]), num: parseInt(parts[1]), width: parseInt(parts[3]), height: parseInt(parts[4]) }
  })
  .filter(({ width, height }) => width >= 150 && height >= 150)

if (!imgMeta.length) {
  console.error('No embedded images found in the specified page range.')
  process.exit(1)
}

// Extract as PNGs — pdfimages names them img-000.png, img-001.png, … (matching num column)
console.log(`Extracting ${imgMeta.length} embedded image(s)...`)
execSync(`pdfimages -png ${pageFlags} "${pdfPath}" "${imgDir}/img"`, { stdio: 'inherit' })

console.log(`Extracted ${imgMeta.length} image(s) → public/images/${slug}/`)

// ── Generate questions via Claude ─────────────────────────────────────────────

console.log(`Generating ${numQuestions} questions...`)

const pdfBase64 = readFileSync(pdfPath).toString('base64')
const client = new Anthropic()

const pageNote = firstPage != null ? ` (focusing on pages ${firstPage}–${lastPage})` : ''

// Build human-readable image list for the prompt: "img-000.png (p.5), img-001.png (p.12)"
const imagesDesc = imgMeta
  .map(({ page, num }) => `${`img-${String(num).padStart(3, '0')}.png`} (p.${page})`)
  .join(', ')

const msg = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 8192,
  messages: [{
    role: 'user',
    content: [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
      },
      {
        type: 'text',
        text: `Generate ${numQuestions} multiple-choice questions from this PDF${pageNote}.

SPECIFICATIONS:
- No hallucination: every fact must come from the source.
- Answer integrity: never embed the answer in the question text.
- Explanations: cite the specific page number (e.g. "p. 142").
- High-nuance distractors: all options must be plausible to a student who hasn't mastered the details.
- Target difficulty: advanced 8th-grader scores 50–75% on first attempt.

Two question types (mix them):
  Type A — Quizlet-style: short, direct, under 2 sentences. Focus on historical significance.
  Type B — Document analysis: paste a verbatim primary source excerpt, then ask a question about it.
            (Primary sources only: inscriptions, decrees, traveler accounts, etc.)
            Format the "question" field as: "<verbatim excerpt>\\n\\n<actual question>"

Return ONLY a valid JSON array, no markdown, no code fences. Schema per element:
{
  "id": "q1",
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "answer": 0,
  "explanation": "... (p. N)",
  "image": "img-000.png"
}

The "image" field is optional. Include it ONLY when one of the extracted images (a map, diagram, chart, or primary-source facsimile) meaningfully helps the student understand or answer the question. Use the exact filename.
Available images: ${imagesDesc}.`,
      },
    ],
  }],
})

// ── Parse & write ─────────────────────────────────────────────────────────────

let questions
try {
  questions = JSON.parse(msg.content[0].text)
} catch {
  console.error('Failed to parse Claude response. Raw output:')
  console.error(msg.content[0].text.slice(0, 500))
  process.exit(1)
}

const processed = questions.map((q, i) => {
  const out = { ...q, id: `q${i + 1}` }
  if (out.image) out.image = `images/${slug}/${out.image}`
  return out
})

const outPath = join(ROOT, 'src', 'banks', `${slug}.jsonl`)
writeFileSync(outPath, processed.map(q => JSON.stringify(q)).join('\n') + '\n')

const withImages = processed.filter(q => q.image).length
console.log(`Done. Wrote ${processed.length} questions to src/banks/${slug}.jsonl`)
console.log(`${withImages} question(s) reference page images.`)
console.log('\nNext steps:')
console.log(`  git add src/banks/${slug}.jsonl public/images/${slug}/`)
console.log(`  git commit -m "Add ${slug} question bank"`)
console.log(`  git push`)
