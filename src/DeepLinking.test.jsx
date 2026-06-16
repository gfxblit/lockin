import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import App from './App.jsx'

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('Deep Linking', () => {
  it('loads a specific bank, question list, and position from the URL', () => {
    // _idx 2 is "Geographical isolation"
    render(<App initialSearch="?bank=chapter-six-commonalities-and-variations&qs=2,1,3,4,5,6,7,8,9,10&i=0" />)

    expect(screen.getByTestId('progress')).toHaveTextContent('Question 1 / 10')
    expect(screen.getByText(/geographical isolation/i)).toBeInTheDocument()
  })

  it('resumes at the given index into the question list', () => {
    render(<App initialSearch="?bank=chapter-six-commonalities-and-variations&qs=2,1,3,4,5,6,7,8,9,10&i=2" />)

    expect(screen.getByTestId('progress')).toHaveTextContent('Question 3 / 10')
  })

  it('handles invalid bankId in URL gracefully', () => {
    render(<App initialSearch="?bank=invalid-bank" />)
    // Should show StartScreen
    expect(screen.getByText(/Chapter Six/i)).toBeInTheDocument()
  })

  it('handles missing qs parameter by sampling a fresh random list', () => {
    render(<App initialSearch="?bank=chapter-six-commonalities-and-variations" />)
    expect(screen.getByTestId('progress')).toHaveTextContent('Question 1 / 10')
    // Since it's randomized, we just check that it's NOT on the StartScreen
    expect(screen.queryByText(/Chapter Six/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('progress')).toBeInTheDocument()
  })

  it('falls back to StartScreen when qs contains an unknown question id', () => {
    render(<App initialSearch="?bank=chapter-six-commonalities-and-variations&qs=1,9999&i=0" />)
    expect(screen.getByText(/Chapter Six/i)).toBeInTheDocument()
  })

  it('clamps an out-of-range i to the last question', () => {
    render(<App initialSearch="?bank=chapter-six-commonalities-and-variations&qs=2,1,3,4,5,6,7,8,9,10&i=99" />)
    expect(screen.getByTestId('progress')).toHaveTextContent('Question 10 / 10')
  })

  it('updates qs and i in the URL as the quiz advances', () => {
    render(<App initialSearch="?bank=chapter-six-commonalities-and-variations&qs=2,1,3,4,5,6,7,8,9,10&i=0" />)
    fireEvent.click(screen.getByTestId('option-0'))
    fireEvent.click(screen.getByText('Next →'))

    const params = new URLSearchParams(window.location.search)
    expect(params.get('qs')).toBe('2,1,3,4,5,6,7,8,9,10')
    expect(params.get('i')).toBe('1')
  })
})
