import { useState } from 'react'

const ACCENT = '#5B6EE8'
const ACCENT_LIGHT = '#eef0fd'

/* ── Bank discovery ────────────────────────────────────────────────────────── */

const bankModules = import.meta.glob('./banks/*.jsonl', { query: '?raw', import: 'default', eager: true })

function parseJSONL(raw) {
  return raw.trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
}

function bankLabel(path) {
  return path
    .replace('./banks/', '')
    .replace('.jsonl', '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

const BANKS = Object.entries(bankModules).map(([path, raw]) => ({
  id: path,
  label: bankLabel(path),
  questions: parseJSONL(raw),
}))

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function scoreLabel(pct) {
  if (pct === 100) return 'Perfect score!'
  if (pct >= 80) return 'Great work!'
  if (pct >= 60) return 'Good effort.'
  return 'Keep practicing.'
}

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
        <div style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af', marginBottom: 18 }}>
          Question {qIndex + 1}<span style={{ color: '#d1d5db' }}> / {total}</span>
        </div>

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
          <div style={{
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
        <div style={{ fontSize: 72, fontWeight: 700, color: ACCENT, lineHeight: 1, marginBottom: 10 }}>
          {pct}<span style={{ fontSize: 30, fontWeight: 500, opacity: 0.7 }}>%</span>
        </div>
        <div style={{ fontSize: 16, color: '#6b7280', fontWeight: 500, marginBottom: 4 }}>
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

export default function App() {
  const [selectedBank, setSelectedBank] = useState(null)
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)

  function handlePick(optIdx) {
    if (answers[qIndex] !== undefined) return
    setAnswers(prev => ({ ...prev, [qIndex]: optIdx }))
  }

  function handleNext() {
    if (qIndex === selectedBank.questions.length - 1) setShowResults(true)
    else setQIndex(i => i + 1)
  }

  function handleRetry() {
    setQIndex(0)
    setAnswers({})
    setShowResults(false)
  }

  function handleBack() {
    setSelectedBank(null)
    setQIndex(0)
    setAnswers({})
    setShowResults(false)
  }

  if (!selectedBank) {
    return <StartScreen onSelect={setSelectedBank} />
  }

  const questions = selectedBank.questions

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        {showResults
          ? <ResultsScreen questions={questions} answers={answers} onRetry={handleRetry} onBack={handleBack} />
          : <QuestionScreen
              q={questions[qIndex]}
              qIndex={qIndex}
              total={questions.length}
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
