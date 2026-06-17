import { useState, useEffect } from 'react'
import { parseJSONL, bankLabel, sampleQuestions, scoreLabel } from './utils'
import { logVisit } from './analytics'


const ACCENT = '#5B6EE8'
const ACCENT_LIGHT = '#eef0fd'
const QUIZ_SIZE = 10

/* ── Bank discovery ────────────────────────────────────────────────────────── */

const bankModules = import.meta.glob('./banks/*.jsonl', { query: '?raw', import: 'default', eager: true })

const BANKS = Object.entries(bankModules).map(([path, raw]) => ({
  id: path.split('/').pop().replace('.jsonl', ''),
  label: bankLabel(path),
  questions: parseJSONL(raw).map((q, i) => ({ ...q, _idx: i + 1 })),
}))

/* ── StartScreen ───────────────────────────────────────────────────────────── */

function StartScreen({ onSelect }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: '#111', marginBottom: 8 }}>Lock In</h1>
          <p style={{ fontSize: 16, color: '#6b7280', fontWeight: 500 }}>Pick a question bank to get started.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BANKS.map(bank => (
            <div
              key={bank.id}
              onClick={() => onSelect(bank)}
              style={{
                background: '#fff',
                borderRadius: 14,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 28px rgba(0,0,0,0.05)',
                padding: '20px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontSize: 17, fontWeight: 600, color: '#111', marginBottom: 3 }}>{bank.label}</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>{bank.questions.length} questions</div>
              </div>
              <div style={{ fontSize: 20, color: ACCENT, fontWeight: 300 }}>→</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function renderText(text) {
  if (!text) return null
  const parts = text.split(/(_[^_]+_)/g)
  return parts.map((part, i) => {
    if (part.startsWith('_') && part.endsWith('_')) {
      return <i key={i} style={{ fontStyle: 'italic', color: '#4b5563' }}>{part.slice(1, -1)}</i>
    }
    return <span key={i}>{part}</span>
  })
}

/* ── Option ────────────────────────────────────────────────────────────────── */

function Option({ index, text, state, onPick }) {
  const letter = String.fromCharCode(65 + index)
  const cfg = {
    default: { bg: '#fff',    border: '#e4e4e7', color: '#111',    dim: 1,   badgeBg: '#f4f4f5', badgeColor: '#a1a1aa', mark: letter },
    correct: { bg: '#f0fdf4', border: '#22c55e', color: '#15803d', dim: 1,   badgeBg: '#22c55e', badgeColor: '#fff',    mark: '✓' },
    wrong:   { bg: '#fff1f2', border: '#f43f5e', color: '#be123c', dim: 1,   badgeBg: '#f43f5e', badgeColor: '#fff',    mark: '✗' },
    dimmed:  { bg: '#fafafa', border: '#e4e4e7', color: '#9ca3af', dim: 0.5, badgeBg: '#f4f4f5', badgeColor: '#d1d5db', mark: letter },
  }[state]

  return (
    <div
      data-testid={`option-${index}`}
      data-state={state}
      onClick={state === 'default' ? () => onPick(index) : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        border: `1.5px solid ${cfg.border}`,
        borderRadius: 10,
        background: cfg.bg,
        opacity: cfg.dim,
        cursor: state === 'default' ? 'pointer' : 'default',
        transition: 'border-color 200ms ease, background 200ms ease, opacity 200ms ease',
        userSelect: 'none',
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
        background: cfg.badgeBg, color: cfg.badgeColor,
        fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 200ms ease, color 200ms ease',
      }}>
        {cfg.mark}
      </div>
      <span style={{ fontSize: 15, fontWeight: 500, color: cfg.color, lineHeight: 1.45, transition: 'color 200ms ease' }}>
        {text}
      </span>
    </div>
  )
}

/* ── QuestionScreen ────────────────────────────────────────────────────────── */

function QuestionScreen({ q, qIndex, total, selected, onPick, onNext, onPrev }) {
  const [copied, setCopied] = useState(false)
  const answered = selected !== undefined
  const isFirst = qIndex === 0
  const isLast = qIndex === total - 1
  const progress = (qIndex / total) * 100

  function getState(i) {
    if (!answered) return 'default'
    if (i === q.answer) return 'correct'
    if (i === selected) return 'wrong'
    return 'dimmed'
  }

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 28px rgba(0,0,0,0.05)',
      overflow: 'hidden', width: '100%',
    }}>
      <div style={{ height: 3, background: '#f0f0f0' }}>
        <div style={{
          height: '100%', width: `${progress}%`, background: ACCENT,
          transition: 'width 500ms cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>

      <div style={{ padding: '32px 36px 36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div data-testid="progress" style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af' }}>
            Question {qIndex + 1}<span style={{ color: '#d1d5db' }}> / {total}</span>
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: ACCENT, fontWeight: 600,
              padding: '4px 8px', borderRadius: 6,
              transition: 'background 150ms ease',
            }}
            onMouseEnter={e => e.target.style.background = ACCENT_LIGHT}
            onMouseLeave={e => e.target.style.background = 'none'}
          >
            {copied ? '✓ Copied!' : 'Copy Permalink'}
          </button>
        </div>

        {q.image && (
          <img
            src={`${import.meta.env.BASE_URL}${q.image}`}
            alt=""
            style={{
              width: '100%', borderRadius: 10,
              border: '1px solid #e4e4e7',
              marginBottom: 20,
              display: 'block',
            }}
          />
        )}

        {/* Question text */}
        <h2 style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.5, color: '#111', margin: '0 0 24px', whiteSpace: 'pre-wrap' }}>
          {renderText(q.question)}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {q.options.map((opt, i) => (
            <Option key={i} index={i} text={opt} state={getState(i)} onPick={onPick} />
          ))}
        </div>

        {answered && q.explanation && (
          <div data-testid="explanation" style={{
            marginTop: 14, padding: '13px 16px',
            background: ACCENT_LIGHT,
            borderLeft: `3px solid ${ACCENT}`,
            borderRadius: '0 8px 8px 0',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 }}>
              Explanation
            </div>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
              {q.explanation}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
          <button
            onClick={!isFirst ? onPrev : undefined}
            disabled={isFirst}
            style={{
              height: 38, padding: '0 20px',
              border: '1.5px solid #e4e4e7', borderRadius: 8,
              background: 'transparent',
              color: !isFirst ? '#374151' : '#d1d5db',
              fontSize: 14, fontWeight: 500,
              cursor: !isFirst ? 'pointer' : 'default',
              transition: 'color 150ms ease',
            }}
          >
            ← Prev
          </button>

          <button
            onClick={answered ? onNext : undefined}
            disabled={!answered}
            style={{
              height: 38, padding: '0 22px',
              border: 'none', borderRadius: 8,
              background: answered ? ACCENT : '#e4e4e7',
              color: '#fff',
              fontSize: 14, fontWeight: 600,
              cursor: answered ? 'pointer' : 'not-allowed',
              opacity: answered ? 1 : 0.55,
              transition: 'background 200ms ease, opacity 200ms ease',
            }}
          >
            {isLast ? 'See Results →' : 'Next →'}
          </button>
        </div>

        <div data-testid="question-id" style={{ marginTop: 16, fontSize: 12, fontWeight: 600, color: '#9ca3af', textAlign: 'center' }}>
          ID: {q.id}
        </div>
      </div>
    </div>
  )
}

/* ── ResultsScreen ─────────────────────────────────────────────────────────── */

function ResultsScreen({ questions, answers, onRetry, onBack }) {
  const correct = questions.filter((q, i) => answers[i] === q.answer).length
  const pct = Math.round((correct / questions.length) * 100)

  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 28px rgba(0,0,0,0.05)',
      overflow: 'hidden', width: '100%',
    }}>
      <div style={{ padding: '48px 36px 36px', textAlign: 'center', borderBottom: '1px solid #f3f3f3' }}>
        <div data-testid="score" style={{ fontSize: 72, fontWeight: 700, color: ACCENT, lineHeight: 1, marginBottom: 10 }}>
          {pct}<span style={{ fontSize: 30, fontWeight: 500, opacity: 0.7 }}>%</span>
        </div>
        <div data-testid="correct-count" style={{ fontSize: 16, color: '#6b7280', fontWeight: 500, marginBottom: 4 }}>
          {correct} of {questions.length} correct
        </div>
        <div style={{ fontSize: 14, color: '#9ca3af' }}>{scoreLabel(pct)}</div>
      </div>

      <div style={{ padding: '24px 36px 36px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 }}>
          Breakdown
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {questions.map((q, i) => {
            const ok = answers[i] === q.answer
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 13,
                padding: '12px 14px',
                border: '1.5px solid #f0f0f0', borderRadius: 10,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: ok ? '#f0fdf4' : '#fff1f2',
                  color: ok ? '#22c55e' : '#f43f5e',
                  fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {ok ? '✓' : '✗'}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginBottom: 2 }}>Q{i + 1}</div>
                  <div style={{ fontSize: 14, color: '#374151', fontWeight: 500, lineHeight: 1.4 }}>{q.question}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={onBack}
            style={{
              flex: 1, padding: '11px',
              border: '1.5px solid #e4e4e7', borderRadius: 10,
              background: 'transparent', color: '#6b7280',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            ← All Banks
          </button>
          <button
            onClick={onRetry}
            style={{
              flex: 2, padding: '11px',
              border: `1.5px solid ${ACCENT}`, borderRadius: 10,
              background: 'transparent', color: ACCENT,
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Retake Quiz
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── App ───────────────────────────────────────────────────────────────────── */

function parseInitialURL(search = window.location.search) {
  const params = new URLSearchParams(search)
  const bankId = params.get('bank')
  if (!bankId) return null

  const bank = BANKS.find(b => b.id === bankId)
  if (!bank) return null

  const qsParam = params.get('qs')
  if (!qsParam) {
    return { bank, sampled: sampleQuestions(bank.questions, QUIZ_SIZE), qIndex: 0 }
  }

  const byIdx = new Map(bank.questions.map(q => [q._idx, q]))
  const ids = qsParam.split(',').map(s => parseInt(s, 10))
  const sampled = ids.map(id => byIdx.get(id))
  if (sampled.length === 0 || sampled.some(q => q === undefined)) return null

  const i = parseInt(params.get('i'), 10)
  const qIndex = Number.isInteger(i) ? Math.min(Math.max(i, 0), sampled.length - 1) : 0

  return { bank, sampled, qIndex }
}

export default function App({ initialSearch }) {
  const [initialState] = useState(() => parseInitialURL(initialSearch))
  const [selectedBank, setSelectedBank] = useState(initialState?.bank ?? null)
  const [activeQuestions, setActiveQuestions] = useState(initialState?.sampled ?? [])
  const [qIndex, setQIndex] = useState(initialState?.qIndex ?? 0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (initialState?.bank) {
      logVisit(`start_quiz:${initialState.bank.id}`)
    }
  }, [initialState])

  function selectBank(bank) {
    logVisit(`start_quiz:${bank.id}`)
    const sampled = sampleQuestions(bank.questions, QUIZ_SIZE)
    setSelectedBank(bank)
    setActiveQuestions(sampled)
    setQIndex(0)
    setAnswers({})
    setShowResults(false)
  }

  // Sync to URL. Built manually (not via URLSearchParams.toString()) so commas
  // in `qs` stay readable instead of being escaped to %2C.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.delete('bank')
    params.delete('qs')
    params.delete('i')
    const rest = params.toString()

    let search = ''
    if (selectedBank && !showResults) {
      const qs = activeQuestions.map(q => q._idx).join(',')
      search = `bank=${encodeURIComponent(selectedBank.id)}&qs=${qs}&i=${qIndex}`
      if (rest) search += '&' + rest
    } else {
      search = rest
    }

    const newUrl = window.location.pathname + (search ? '?' + search : '')
    window.history.replaceState({}, '', newUrl)
  }, [selectedBank, activeQuestions, qIndex, showResults])

  function handlePick(optIdx) {
    if (answers[qIndex] !== undefined) return
    setAnswers(prev => ({ ...prev, [qIndex]: optIdx }))
  }

  function handleNext() {
    if (qIndex === activeQuestions.length - 1) {
      const correct = activeQuestions.filter((q, i) => answers[i] === q.answer).length
      const pct = Math.round((correct / activeQuestions.length) * 100)
      logVisit(`complete_quiz:${selectedBank.id}`, pct)
      setShowResults(true)
    } else {
      setQIndex(i => i + 1)
    }
  }

  function handleRetry() {
    logVisit(`start_quiz:${selectedBank.id}`)
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


  if (!selectedBank) {
    return <StartScreen onSelect={selectBank} />
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        {showResults
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
      </div>
    </div>
  )
}
