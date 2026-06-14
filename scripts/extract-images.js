#!/usr/bin/env node
/**
 * Usage: node scripts/extract-images.js <pdf-path> [--pages N-M] [--min-size PX]
 * Example: node scripts/extract-images.js ./strayer-ch6.pdf --pages 1-40 --min-size 150
 *
 * Extracts embedded images (maps, photos, charts) from a PDF.
 * Skips small decorative images below --min-size (default 150px).
 * Outputs to public/images/<slug>/img-000.png, img-001.png, …
 *
 * Requires poppler: brew install poppler
 */

import { mkdirSync, existsSync } from 'fs'
import { join, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const args = process.argv.slice(2)
if (!args[0]) {
  console.error('Usage: node scripts/extract-images.js <pdf-path> [--pages N-M] [--min-size PX]')
  process.exit(1)
}

const pdfPath = args[0]
let firstPage = null, lastPage = null, minSize = 150

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--pages' && args[i + 1]) {
    const parts = args[i + 1].split('-').map(Number)
    firstPage = parts[0]
    lastPage = parts[1] ?? parts[0]
    i++
  } else if (args[i] === '--min-size' && args[i + 1]) {
    minSize = parseInt(args[i + 1])
    i++
  }
}

if (!existsSync(pdfPath)) {
  console.error(`File not found: ${pdfPath}`)
  process.exit(1)
}

try {
  execSync('which pdfimages', { stdio: 'pipe' })
} catch {
  console.error('pdfimages not found. Install poppler:\n  brew install poppler')
  process.exit(1)
}

const slug = basename(pdfPath, extname(pdfPath))
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '')

const imgDir = join(ROOT, 'public', 'images', slug)
mkdirSync(imgDir, { recursive: true })

const pageFlags = [
  firstPage != null ? `-f ${firstPage}` : '',
  lastPage  != null ? `-l ${lastPage}`  : '',
].filter(Boolean).join(' ')

console.log(`Scanning ${pdfPath}...`)
const listOutput = execSync(`pdfimages -list ${pageFlags} "${pdfPath}"`, { encoding: 'utf8' })

const allCount = listOutput.split('\n').filter(l => /^\s+\d/.test(l)).length
const imgMeta = listOutput.split('\n')
  .filter(line => /^\s+\d/.test(line))
  .map(line => {
    const parts = line.trim().split(/\s+/)
    return { page: parseInt(parts[0]), num: parseInt(parts[1]), width: parseInt(parts[3]), height: parseInt(parts[4]) }
  })
  .filter(({ width, height }) => width >= minSize && height >= minSize)

if (!imgMeta.length) {
  console.error(`No images ≥${minSize}px found. Try --min-size 50 to see smaller images.`)
  process.exit(1)
}

console.log(`Found ${imgMeta.length} image(s) ≥${minSize}px (${allCount} total in PDF). Extracting...`)
execSync(`pdfimages -png ${pageFlags} "${pdfPath}" "${imgDir}/img"`, { stdio: 'inherit' })

console.log('\nExtracted images:')
imgMeta.forEach(({ page, num, width, height }) => {
  const file = `img-${String(num).padStart(3, '0')}.png`
  console.log(`  public/images/${slug}/${file}  (p.${page}, ${width}×${height}px)`)
})
