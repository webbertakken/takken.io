import { suuntoOceanScubaFixture } from '@site/src/domain/diving/suunto/__fixtures__/index'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SuuntoToSsiDiveLogHelper from './index'

const uploadFixture = (container: HTMLElement): void => {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  const file = new File([suuntoOceanScubaFixture()], 'suunto-ocean-scuba.fit')
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  fireEvent.input(input)
}

describe('SuuntoToSsiDiveLogHelper', () => {
  it('renders the title and upload instructions', () => {
    render(<SuuntoToSsiDiveLogHelper />)

    expect(
      screen.getByRole('heading', { name: 'Suunto to SSI DiveLog helper' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Upload your Suunto/i)).toBeInTheDocument()
    expect(screen.getByText(/This page does not store data/i)).toBeInTheDocument()
    expect(screen.getByText(/Download FIT file/i)).toBeInTheDocument()
  })

  it('links to the Garmin tool for divers on the other vendor', () => {
    render(<SuuntoToSsiDiveLogHelper />)

    const link = screen.getByRole('link', { name: /Garmin to SSI dive log helper/i })
    expect(link).toHaveAttribute('href', '/tools/garmin-to-ssi-dive-log-helper')
  })

  it('converts an uploaded Suunto dive into the expected QR payload', async () => {
    const { container } = render(<SuuntoToSsiDiveLogHelper />)

    uploadFixture(container)

    await waitFor(() => expect(screen.getByText('Importing your dive')).toBeInTheDocument())

    const details = screen.getByText('Developer data').closest('details') as HTMLElement
    const payload = within(details).getByText(/dive_type:0/)
    expect(payload.textContent).toContain('divetime:51')
    expect(payload.textContent).toContain('depth_m:11.9')
    expect(payload.textContent).toContain('watertemp_c:29')
    expect(payload.textContent).not.toContain('undefined')
  })

  it('does not show a vendor-mismatch notice for a Suunto file', async () => {
    const { container } = render(<SuuntoToSsiDiveLogHelper />)

    uploadFixture(container)

    await waitFor(() => expect(screen.getByText('Importing your dive')).toBeInTheDocument())
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  it('renders the decoded message groups in the developer data', async () => {
    const { container } = render(<SuuntoToSsiDiveLogHelper />)

    uploadFixture(container)

    await waitFor(() => expect(screen.getByText('sessionMesgs')).toBeInTheDocument())
    expect(screen.getByText('recordMesgs')).toBeInTheDocument()
  })
})
