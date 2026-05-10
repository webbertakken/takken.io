import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import RawTuner from './index'

describe('RawTuner', () => {
  it('renders inside a ToolPage with the expected title', () => {
    render(<RawTuner />)

    expect(screen.getByRole('heading', { name: 'RAW tuner' })).toBeInTheDocument()
  })

  it('explains that processing happens locally on the user GPU', () => {
    render(<RawTuner />)

    expect(screen.getByText(/runs in your browser/i)).toBeInTheDocument()
    expect(screen.getByText(/Nothing is uploaded/i)).toBeInTheDocument()
  })
})
