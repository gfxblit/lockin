import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import App from './App.jsx'

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('Deep Linking', () => {
  it('loads a specific bank and question from URL', () => {
    // q=1 is the second question (_idx: 1), which is "Geographical isolation"
    render(<App initialSearch="?bank=chapter-six-commonalities-and-variations&q=1" />)
    
    expect(screen.getByTestId('progress')).toHaveTextContent('Question 1 / 10')
    expect(screen.getByText(/geographical isolation/i)).toBeInTheDocument()
  })

  it('handles invalid bankId in URL gracefully', () => {
    render(<App initialSearch="?bank=invalid-bank" />)
    // Should show StartScreen
    expect(screen.getByText(/Chapter Six/i)).toBeInTheDocument()
  })

  it('handles missing q parameter by defaulting to start of bank', () => {
    render(<App initialSearch="?bank=chapter-six-commonalities-and-variations" />)
    expect(screen.getByTestId('progress')).toHaveTextContent('Question 1 / 10')
    // Since it's randomized, we just check that it's NOT on the StartScreen
    expect(screen.queryByText(/Chapter Six/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('progress')).toBeInTheDocument()
  })
})
