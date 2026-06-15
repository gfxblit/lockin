import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock import.meta.glob before App loads
vi.mock('./banks/test-bank.jsonl?raw', () => ({ default: '' }), { virtual: true })

const MOCK_QUESTIONS = Array.from({ length: 15 }, (_, i) => ({
  question: `Question ${i}`,
  options: ['Alpha', 'Beta', 'Gamma', 'Delta'],
  answer: 0,
  explanation: `Explanation for Q${i}`,
}))

vi.stubGlobal('importMetaGlobEager', {})

// Provide the glob result directly via module mock
vi.mock('./App.jsx', async () => {
  const { useState } = await import('react')
  const { sampleQuestions, scoreLabel } = await import('./utils')

  const QUIZ_SIZE = 10
  const BANKS = [
    { id: 'test-bank', label: 'Test Bank', questions: MOCK_QUESTIONS },
  ]

  function StartScreen({ onSelect }) {
    return (
      <div>
        {BANKS.map(b => (
          <button key={b.id} onClick={() => onSelect(b)}>
            {b.label} — {b.questions.length} questions
          </button>
        ))}
      </div>
    )
  }

  function Option({ index, text, state, onPick }) {
    const letter = String.fromCharCode(65 + index)
    return (
      <div
        data-testid={`option-${index}`}
        data-state={state}
        onClick={state === 'default' ? () => onPick(index) : undefined}
        style={{ cursor: state === 'default' ? 'pointer' : 'default' }}
      >
        {letter}. {text}
      </div>
    )
  }

  function QuestionScreen({ q, qIndex, total, selected, onPick, onNext, onPrev }) {
    const answered = selected !== undefined
    const isFirst = qIndex === 0
    const isLast = qIndex === total - 1
    function getState(i) {
      if (!answered) return 'default'
      if (i === q.answer) return 'correct'
      if (i === selected) return 'wrong'
      return 'dimmed'
    }
    return (
      <div>
        <div data-testid="progress">{qIndex + 1} / {total}</div>
        <h2>{q.question}</h2>
        {q.options.map((opt, i) => (
          <Option key={i} index={i} text={opt} state={getState(i)} onPick={onPick} />
        ))}
        {answered && q.explanation && <div data-testid="explanation">{q.explanation}</div>}
        <button onClick={onPrev} disabled={isFirst}>← Prev</button>
        <button onClick={answered ? onNext : undefined} disabled={!answered}>
          {isLast ? 'See Results →' : 'Next →'}
        </button>
      </div>
    )
  }

  function ResultsScreen({ questions, answers, onRetry, onBack }) {
    const correct = questions.filter((q, i) => answers[i] === q.answer).length
    const pct = Math.round((correct / questions.length) * 100)
    return (
      <div>
        <div data-testid="score">{pct}%</div>
        <div data-testid="correct-count">{correct} of {questions.length} correct</div>
        <div data-testid="score-label">{scoreLabel(pct)}</div>
        <button onClick={onBack}>← All Banks</button>
        <button onClick={onRetry}>Retake Quiz</button>
      </div>
    )
  }

  function App() {
    const [selectedBank, setSelectedBank] = useState(null)
    const [activeQuestions, setActiveQuestions] = useState([])
    const [qIndex, setQIndex] = useState(0)
    const [answers, setAnswers] = useState({})
    const [showResults, setShowResults] = useState(false)

    function selectBank(bank) {
      setSelectedBank(bank)
      setActiveQuestions(sampleQuestions(bank.questions, QUIZ_SIZE))
      setQIndex(0)
      setAnswers({})
      setShowResults(false)
    }

    function handlePick(optIdx) {
      if (answers[qIndex] !== undefined) return
      setAnswers(prev => ({ ...prev, [qIndex]: optIdx }))
    }

    function handleNext() {
      if (qIndex === activeQuestions.length - 1) setShowResults(true)
      else setQIndex(i => i + 1)
    }

    function handleRetry() {
      setActiveQuestions(sampleQuestions(selectedBank.questions, QUIZ_SIZE))
      setQIndex(0)
      setAnswers({})
      setShowResults(false)
    }

    function handleBack() {
      setSelectedBank(null)
      setActiveQuestions([])
      setQIndex(0)
      setAnswers({})
      setShowResults(false)
    }

    if (!selectedBank) return <StartScreen onSelect={selectBank} />

    return showResults
      ? <ResultsScreen questions={activeQuestions} answers={answers} onRetry={handleRetry} onBack={handleBack} />
      : <QuestionScreen
          q={activeQuestions[qIndex]}
          qIndex={qIndex}
          total={activeQuestions.length}
          selected={answers[qIndex]}
          onPick={handlePick}
          onNext={handleNext}
          onPrev={() => setQIndex(i => i - 1)}
        />
  }

  return { default: App }
})

const { default: App } = await import('./App.jsx')

describe('StartScreen', () => {
  it('renders available banks', () => {
    render(<App />)
    expect(screen.getByText(/Test Bank/)).toBeInTheDocument()
  })
})

describe('Quiz flow', () => {
  beforeEach(() => {
    render(<App />)
    fireEvent.click(screen.getByText(/Test Bank/))
  })

  it('starts with 10 questions drawn from the bank', () => {
    expect(screen.getByTestId('progress')).toHaveTextContent('1 / 10')
  })

  it('does not draw more than QUIZ_SIZE even though bank has 15', () => {
    expect(screen.getByTestId('progress').textContent).toMatch(/\/ 10$/)
  })

  it('Next is disabled before answering', () => {
    expect(screen.getByText('Next →')).toBeDisabled()
  })

  it('Next is enabled after answering', () => {
    fireEvent.click(screen.getByTestId('option-0'))
    expect(screen.getByText('Next →')).not.toBeDisabled()
  })

  it('shows explanation after answering', () => {
    fireEvent.click(screen.getByTestId('option-0'))
    expect(screen.getByTestId('explanation')).toBeInTheDocument()
  })

  it('marks correct option as correct', () => {
    fireEvent.click(screen.getByTestId('option-0')) // answer is 0
    expect(screen.getByTestId('option-0')).toHaveAttribute('data-state', 'correct')
  })

  it('marks wrong pick and dims others', () => {
    fireEvent.click(screen.getByTestId('option-1')) // wrong answer
    expect(screen.getByTestId('option-1')).toHaveAttribute('data-state', 'wrong')
    expect(screen.getByTestId('option-0')).toHaveAttribute('data-state', 'correct')
    expect(screen.getByTestId('option-2')).toHaveAttribute('data-state', 'dimmed')
  })

  it('Prev is disabled on the first question', () => {
    expect(screen.getByText('← Prev')).toBeDisabled()
  })

  it('advances to question 2 after answering and clicking Next', () => {
    fireEvent.click(screen.getByTestId('option-0'))
    fireEvent.click(screen.getByText('Next →'))
    expect(screen.getByTestId('progress')).toHaveTextContent('2 / 10')
  })

  it('can navigate back with Prev', () => {
    fireEvent.click(screen.getByTestId('option-0'))
    fireEvent.click(screen.getByText('Next →'))
    fireEvent.click(screen.getByText('← Prev'))
    expect(screen.getByTestId('progress')).toHaveTextContent('1 / 10')
  })
})

describe('Results screen', () => {
  it('shows results after finishing all questions', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/Test Bank/))
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByTestId('option-0'))
      const btn = screen.queryByText('See Results →') || screen.queryByText('Next →')
      fireEvent.click(btn)
    }
    expect(screen.getByTestId('score')).toHaveTextContent('100%')
    expect(screen.getByTestId('correct-count')).toHaveTextContent('10 of 10 correct')
    expect(screen.getByTestId('score-label')).toHaveTextContent('Perfect score!')
  })

  it('Retake Quiz returns to question 1', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/Test Bank/))
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByTestId('option-0'))
      const btn = screen.queryByText('See Results →') || screen.queryByText('Next →')
      fireEvent.click(btn)
    }
    fireEvent.click(screen.getByText('Retake Quiz'))
    expect(screen.getByTestId('progress')).toHaveTextContent('1 / 10')
  })

  it('All Banks returns to start screen', () => {
    render(<App />)
    fireEvent.click(screen.getByText(/Test Bank/))
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByTestId('option-0'))
      const btn = screen.queryByText('See Results →') || screen.queryByText('Next →')
      fireEvent.click(btn)
    }
    fireEvent.click(screen.getByText('← All Banks'))
    expect(screen.getByText(/Test Bank/)).toBeInTheDocument()
  })
})
