import { describe, it, expect } from 'vitest'
import { parseJSONL, bankLabel, sampleQuestions, scoreLabel } from './utils'

describe('utils', () => {
  it('parseJSONL parses valid JSONL', () => {
    const raw = '{"a":1}\n{"b":2}'
    expect(parseJSONL(raw)).toEqual([{ a: 1 }, { b: 2 }])
  })

  it('bankLabel formats filenames', () => {
    expect(bankLabel('./banks/my-bank-name.jsonl')).toBe('My Bank Name')
  })

  it('sampleQuestions returns n questions', () => {
    const questions = [1, 2, 3, 4, 5]
    expect(sampleQuestions(questions, 3)).toHaveLength(3)
  })

  it('scoreLabel returns correct thresholds', () => {
    expect(scoreLabel(100)).toBe('Perfect score!')
    expect(scoreLabel(85)).toBe('Great work!')
    expect(scoreLabel(65)).toBe('Good effort.')
    expect(scoreLabel(40)).toBe('Keep practicing.')
  })
})
