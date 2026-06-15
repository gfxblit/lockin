import { describe, it, expect } from 'vitest'
import { sampleQuestions, scoreLabel, parseJSONL, bankLabel } from './utils'

const makeBank = n => Array.from({ length: n }, (_, i) => ({ id: i, question: `Q${i}` }))

describe('sampleQuestions', () => {
  it('returns n questions when bank is larger', () => {
    expect(sampleQuestions(makeBank(20), 10)).toHaveLength(10)
  })

  it('returns all questions when bank is smaller than n', () => {
    expect(sampleQuestions(makeBank(5), 10)).toHaveLength(5)
  })

  it('returns all when bank equals n', () => {
    expect(sampleQuestions(makeBank(10), 10)).toHaveLength(10)
  })

  it('does not mutate the original array', () => {
    const bank = makeBank(20)
    const original = bank.map(q => q.id)
    sampleQuestions(bank, 10)
    expect(bank.map(q => q.id)).toEqual(original)
  })

  it('contains no duplicate items', () => {
    const result = sampleQuestions(makeBank(20), 10)
    const ids = result.map(q => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only returns items from the original bank', () => {
    const bank = makeBank(20)
    const result = sampleQuestions(bank, 10)
    result.forEach(q => expect(bank).toContain(q))
  })

  it('shuffles — produces different orders across calls', () => {
    const bank = makeBank(20)
    const orders = new Set(
      Array.from({ length: 30 }, () => sampleQuestions(bank, 10).map(q => q.id).join(','))
    )
    expect(orders.size).toBeGreaterThan(1)
  })

  it('handles a bank of 1', () => {
    expect(sampleQuestions(makeBank(1), 10)).toHaveLength(1)
  })

  it('handles n = 1', () => {
    expect(sampleQuestions(makeBank(20), 1)).toHaveLength(1)
  })
})

describe('scoreLabel', () => {
  it('returns perfect at 100', () => expect(scoreLabel(100)).toBe('Perfect score!'))
  it('returns great at 80', () => expect(scoreLabel(80)).toMatch(/great/i))
  it('returns great at 99', () => expect(scoreLabel(99)).toMatch(/great/i))
  it('returns good at 60', () => expect(scoreLabel(60)).toMatch(/good/i))
  it('returns good at 79', () => expect(scoreLabel(79)).toMatch(/good/i))
  it('returns keep practicing at 59', () => expect(scoreLabel(59)).toMatch(/keep/i))
  it('returns keep practicing at 0', () => expect(scoreLabel(0)).toMatch(/keep/i))
})

describe('parseJSONL', () => {
  it('parses multiple lines', () => {
    expect(parseJSONL('{"a":1}\n{"b":2}')).toEqual([{ a: 1 }, { b: 2 }])
  })

  it('handles trailing newline', () => {
    expect(parseJSONL('{"a":1}\n')).toHaveLength(1)
  })

  it('skips blank lines', () => {
    expect(parseJSONL('{"a":1}\n\n{"b":2}')).toHaveLength(2)
  })

  it('trims leading/trailing whitespace', () => {
    expect(parseJSONL('  {"a":1}  ')).toEqual([{ a: 1 }])
  })
})

describe('bankLabel', () => {
  it('converts kebab-case filename to title case', () => {
    expect(bankLabel('./banks/chapter-six.jsonl')).toBe('Chapter Six')
  })

  it('handles multiple words', () => {
    expect(bankLabel('./banks/foo-bar-baz.jsonl')).toBe('Foo Bar Baz')
  })

  it('works with deep paths', () => {
    expect(bankLabel('/some/deep/path/my-bank.jsonl')).toBe('My Bank')
  })
})
