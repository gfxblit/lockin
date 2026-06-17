import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

// Make sampling deterministic: skip shuffle, just slice
vi.mock('./utils.js', async (importOriginal) => {
  const real = await importOriginal()
  return { ...real, sampleQuestions: (questions, n) => questions.slice(0, n) }
})

// Import real App AFTER mock is hoisted
import App from './App.jsx'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.history.replaceState({}, '', '/')
})

// Bank answers in order: [1,2,1,2,1,1,0,1,2,2]
const ANSWERS = [1, 2, 1, 2, 1, 1, 0, 1, 2, 2]

function clickOption(i) {
  fireEvent.click(screen.getByTestId(`option-${i}`))
}

function clickNext() {
  const btn = screen.queryByText('See Results →') ?? screen.queryByText('Next →')
  fireEvent.click(btn)
}

function completeQuiz({ correct = false } = {}) {
  render(<App />)
  fireEvent.click(screen.getByText(/Chapter Six/i))
  for (let i = 0; i < 10; i++) {
    clickOption(correct ? ANSWERS[i] : (ANSWERS[i] === 0 ? 1 : 0))
    clickNext()
  }
}

/* ── StartScreen ─────────────────────────────────────────────────────────── */

describe('StartScreen', () => {
  it('renders the bank name', () => {
    render(<App />)
    expect(screen.getByText(/Chapter Six/i)).toBeInTheDocument()
  })

  it('shows question count', () => {
    render(<App />)
    expect(screen.getAllByText(/questions/i)[0]).toBeInTheDocument()
  })

  it('clicking a bank starts the quiz', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/Chapter Six/i))
    expect(screen.getByTestId('progress')).toBeInTheDocument()
  })
})

/* ── QuestionScreen ──────────────────────────────────────────────────────── */

describe('QuestionScreen', () => {
  beforeEach(() => {
    render(<App />)
    fireEvent.click(screen.getByText(/Chapter Six/i))
  })

  it('starts at question 1 of 10', () => {
    expect(screen.getByTestId('progress')).toHaveTextContent('Question 1')
    expect(screen.getByTestId('progress')).toHaveTextContent('/ 10')
  })

  it('renders all 4 options', () => {
    expect(screen.getByTestId('option-0')).toBeInTheDocument()
    expect(screen.getByTestId('option-1')).toBeInTheDocument()
    expect(screen.getByTestId('option-2')).toBeInTheDocument()
    expect(screen.getByTestId('option-3')).toBeInTheDocument()
  })

  it('all options start in default state', () => {
    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`option-${i}`)).toHaveAttribute('data-state', 'default')
    }
  })

  it('Next is disabled before answering', () => {
    expect(screen.getByText('Next →')).toBeDisabled()
  })

  it('Prev is disabled on question 1', () => {
    expect(screen.getByText('← Prev')).toBeDisabled()
  })

  it('Next enables after picking any option', () => {
    clickOption(0)
    expect(screen.getByText('Next →')).not.toBeDisabled()
  })

  it('shows explanation after answering', () => {
    expect(screen.queryByTestId('explanation')).not.toBeInTheDocument()
    clickOption(0)
    expect(screen.getByTestId('explanation')).toBeInTheDocument()
  })

  it('marks the correct option as correct', () => {
    clickOption(ANSWERS[0]) // answer for Q1 is 1
    expect(screen.getByTestId(`option-${ANSWERS[0]}`)).toHaveAttribute('data-state', 'correct')
  })

  it('marks wrong pick, highlights correct, dims rest', () => {
    const wrong = ANSWERS[0] === 0 ? 1 : 0
    clickOption(wrong)
    expect(screen.getByTestId(`option-${wrong}`)).toHaveAttribute('data-state', 'wrong')
    expect(screen.getByTestId(`option-${ANSWERS[0]}`)).toHaveAttribute('data-state', 'correct')
    // remaining two options are dimmed
    for (let i = 0; i < 4; i++) {
      if (i !== wrong && i !== ANSWERS[0]) {
        expect(screen.getByTestId(`option-${i}`)).toHaveAttribute('data-state', 'dimmed')
      }
    }
  })

  it('ignores second click after answering', () => {
    const wrong = ANSWERS[0] === 0 ? 1 : 0
    clickOption(wrong)
    clickOption(ANSWERS[0]) // try to change answer — should be ignored
    expect(screen.getByTestId(`option-${wrong}`)).toHaveAttribute('data-state', 'wrong')
  })

  it('advances to question 2 after Next', () => {
    clickOption(0)
    clickNext()
    expect(screen.getByTestId('progress')).toHaveTextContent('Question 2')
  })

  it('Prev becomes enabled after advancing', () => {
    clickOption(0)
    clickNext()
    expect(screen.getByText('← Prev')).not.toBeDisabled()
  })

  it('Prev navigates back to previous question', () => {
    clickOption(0)
    clickNext()
    fireEvent.click(screen.getByText('← Prev'))
    expect(screen.getByTestId('progress')).toHaveTextContent('Question 1')
  })

  it('preserves answer when navigating back', () => {
    const wrong = ANSWERS[0] === 0 ? 1 : 0
    clickOption(wrong)
    clickNext()
    fireEvent.click(screen.getByText('← Prev'))
    expect(screen.getByTestId(`option-${wrong}`)).toHaveAttribute('data-state', 'wrong')
  })

  it('shows "See Results →" on the last question', () => {
    // advance to question 10
    for (let i = 0; i < 9; i++) {
      clickOption(0)
      clickNext()
    }
    expect(screen.getByText('See Results →')).toBeInTheDocument()
  })

  it('shows the question text', () => {
    // Q1 mentions Meroë
    expect(screen.getByText(/Mero/i)).toBeInTheDocument()
  })
})

/* ── ResultsScreen ───────────────────────────────────────────────────────── */

describe('ResultsScreen', () => {
  it('shows 100% when all answers are correct', () => {
    completeQuiz({ correct: true })
    expect(screen.getByTestId('score')).toHaveTextContent('100')
    expect(screen.getByTestId('correct-count')).toHaveTextContent('10 of 10 correct')
    expect(screen.getByText('Perfect score!')).toBeInTheDocument()
  })

  it('shows 0% when all answers are wrong', () => {
    completeQuiz({ correct: false })
    expect(screen.getByTestId('score')).toHaveTextContent('0')
    expect(screen.getByTestId('correct-count')).toHaveTextContent('0 of 10 correct')
    expect(screen.getByText('Keep practicing.')).toBeInTheDocument()
  })

  it('shows breakdown list with one row per question', () => {
    completeQuiz({ correct: true })
    // 10 breakdown rows — each has a Q{n} label
    expect(screen.getByText('Q1')).toBeInTheDocument()
    expect(screen.getByText('Q10')).toBeInTheDocument()
  })

  it('Retake Quiz resets to question 1', () => {
    completeQuiz({ correct: true })
    fireEvent.click(screen.getByText('Retake Quiz'))
    expect(screen.getByTestId('progress')).toHaveTextContent('Question 1')
  })

  it('Retake Quiz clears previous answers', () => {
    completeQuiz({ correct: true })
    fireEvent.click(screen.getByText('Retake Quiz'))
    expect(screen.getByText('Next →')).toBeDisabled()
  })

  it('All Banks returns to start screen', () => {
    completeQuiz({ correct: true })
    fireEvent.click(screen.getByText('← All Banks'))
    expect(screen.getByText(/Chapter Six/i)).toBeInTheDocument()
    expect(screen.queryByTestId('progress')).not.toBeInTheDocument()
  })
})

/* ── scoreLabel via results ─────────────────────────────────────────────── */

describe('score labels via results screen', () => {
  it('shows "Great work!" when score is 80–99%', () => {
    // Get exactly 8 correct out of 10 = 80%
    render(<App />)
    fireEvent.click(screen.getByText(/Chapter Six/i))
    for (let i = 0; i < 10; i++) {
      // correct for first 8, wrong for last 2
      clickOption(i < 8 ? ANSWERS[i] : (ANSWERS[i] === 0 ? 1 : 0))
      clickNext()
    }
    expect(screen.getByText('Great work!')).toBeInTheDocument()
  })

  it('shows "Good effort." when score is 60–79%', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/Chapter Six/i))
    for (let i = 0; i < 10; i++) {
      // correct for first 6, wrong for last 4
      clickOption(i < 6 ? ANSWERS[i] : (ANSWERS[i] === 0 ? 1 : 0))
      clickNext()
    }
    expect(screen.getByText('Good effort.')).toBeInTheDocument()
  })
})
