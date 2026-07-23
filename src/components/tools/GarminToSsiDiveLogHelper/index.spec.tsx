import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import GarminToSsiDiveLogHelper from './index'

describe('GarminToSsiDiveLogHelper', () => {
  it('renders inside a ToolPage with the expected title', () => {
    render(<GarminToSsiDiveLogHelper />)

    expect(
      screen.getByRole('heading', { name: 'Garmin to SSI DiveLog helper' }),
    ).toBeInTheDocument()
  })

  it('explains the upload steps and that no data is stored', () => {
    render(<GarminToSsiDiveLogHelper />)

    expect(screen.getByText(/Upload your garmin/i)).toBeInTheDocument()
    expect(screen.getByText(/Scan the resulting QR code in the SSI app/i)).toBeInTheDocument()
    expect(screen.getByText(/This page does not store data/i)).toBeInTheDocument()
  })

  it('offers a file selector button', () => {
    render(<GarminToSsiDiveLogHelper />)

    expect(screen.getByRole('button', { name: /Select file/i })).toBeInTheDocument()
  })
})
