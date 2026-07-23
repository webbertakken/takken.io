import { suuntoOceanScubaFixture } from '@site/src/domain/diving/suunto/__fixtures__/index'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

  it('still converts a Suunto file but flags the vendor mismatch', async () => {
    const { container } = render(<GarminToSsiDiveLogHelper />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([suuntoOceanScubaFixture()], 'suunto-ocean-scuba.fit')
    Object.defineProperty(input, 'files', { value: [file], configurable: true })

    fireEvent.input(input)

    await waitFor(() => expect(screen.getByText('Importing your dive')).toBeInTheDocument())
    const notice = screen.getByRole('note')
    expect(notice).toHaveTextContent(/Suunto file/i)
    expect(
      within(notice).getByRole('link', { name: /Suunto to SSI dive log helper/i }),
    ).toHaveAttribute('href', '/tools/suunto-to-ssi-dive-log-helper')
  })
})
