#!/usr/bin/env node
/**
 * Usage: node scripts/generate-bank.js "<Topic>" [count]
 * Example: node scripts/generate-bank.js "Python OOP" 10
 *
 * Writes src/banks/<slug>.jsonl. Then: git add src/banks/ && git commit && git push
 * Requires ANTHROPIC_API_KEY in env.
 */

import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const [,, topic, rawCount = '10'] = process.argv
if (!topic) {
  console.error('Usage: node scripts/generate-bank.js "<Topic>" [count]')
  process.exit(1)
}

const n = parseInt(rawCount, 10)
const slug = topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
const outFile = `src/banks/${slug}.jsonl`

console.log(`Generating ${n} questions about "${topic}"...`)

const client = new Anthropic()

const msg = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 4096,
  messages: [{
    role: 'user',
    content: `Generate ${n} multiple-choice quiz questions about "${topic}".

Return ONLY a valid JSON array with no markdown, no explanation, no code fences. Each element:
{
  "id": "q1",
  "question": "question text",
  "options": ["option A", "option B", "option C", "option D"],
  "answer": 0,
  "explanation": "1-2 sentence explanation of why the answer is correct"
}

Requirements:
- Exactly 4 options per question
- answer is the 0-indexed position of the correct option
- explanation is concise (1-2 sentences); omit the field entirely if the answer is obvious from the question
- vary difficulty from introductory to advanced
- no duplicate questions`,
  }],
})

const questions = JSON.parse(msg.content[0].text)
const jsonl = questions.map((q, i) => JSON.stringify({ ...q, id: `q${i + 1}` })).join('\n') + '\n'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '..', outFile)
writeFileSync(outPath, jsonl)

console.log(`Done. Wrote ${questions.length} questions to ${outFile}`)
console.log(`\nNext steps:`)
console.log(`  git add ${outFile}`)
console.log(`  git commit -m "Add ${topic} question bank"`)
console.log(`  git push`)
