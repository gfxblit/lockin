export function parseJSONL(raw) {
  return raw.trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
}

export function bankLabel(path) {
  return path
    .split('/')
    .pop()
    .replace('.jsonl', '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

export function sampleQuestions(questions, n) {
  const shuffled = [...questions]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(n, shuffled.length))
}

export function scoreLabel(pct) {
  if (pct === 100) return 'Perfect score!'
  if (pct >= 80) return 'Great work!'
  if (pct >= 60) return 'Good effort.'
  return 'Keep practicing.'
}
