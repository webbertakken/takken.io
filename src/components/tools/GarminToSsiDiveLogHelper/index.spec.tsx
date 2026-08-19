import { Decoder } from '@garmin-fit/sdk'
import { garminDescentScubaFixture } from '@site/src/domain/diving/garmin/__fixtures__/index'
import { SsiDive } from '@site/src/domain/diving/ssi/SsiDive'
import { suuntoOceanScubaFixture } from '@site/src/domain/diving/suunto/__fixtures__/index'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { zipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'
import GarminToSsiDiveLogHelper from './index'

describe('GarminToSsiDiveLogHelper', () => {
  it('accepts multiple files at once', async () => {
    const { container } = render(<GarminToSsiDiveLogHelper />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file1 = new File([suuntoOceanScubaFixture()], 'dive-1.fit')
    const file2 = new File([garminDescentScubaFixture()], 'dive-2.fit')
    Object.defineProperty(input, 'files', { value: [file1, file2], configurable: true })

    fireEvent.input(input)

    await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'dive-1.fit' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Next dive/i }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'dive-2.fit' })).toBeInTheDocument(),
    )
    expect(screen.getByText('2 / 2')).toBeInTheDocument()
  })

  it('does not duplicate a file that was already uploaded', async () => {
    const { container } = render(<GarminToSsiDiveLogHelper />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const suunto = suuntoOceanScubaFixture()
    const garmin = garminDescentScubaFixture()
    const zip1 = zipSync({ 'suunto.fit': suunto }) as Uint8Array<ArrayBuffer>
    const zip2 = zipSync({ 'suunto.fit': suunto, 'garmin.fit': garmin }) as Uint8Array<ArrayBuffer>

    Object.defineProperty(input, 'files', {
      value: [new File([zip1], 'first.zip')],
      configurable: true,
    })
    fireEvent.input(input)
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'suunto.fit' })).toBeInTheDocument(),
    )

    Object.defineProperty(input, 'files', {
      value: [new File([zip2], 'second.zip')],
      configurable: true,
    })
    fireEvent.input(input)

    await waitFor(() => expect(screen.getByText('2 / 2')).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'garmin.fit' })).toBeInTheDocument()
  })

  it('parses files dropped on the page', async () => {
    render(<GarminToSsiDiveLogHelper />)
    const file1 = new File([suuntoOceanScubaFixture()], 'drop-1.fit')
    const file2 = new File([garminDescentScubaFixture()], 'drop-2.fit')
    const dataTransfer = { files: [file1, file2] }

    fireEvent.dragEnter(window, { dataTransfer })
    fireEvent.drop(window, { dataTransfer })

    await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'drop-1.fit' })).toBeInTheDocument()
  })

  it('keeps the drop overlay while a drag is still active across nested elements', async () => {
    render(<GarminToSsiDiveLogHelper />)
    const dataTransfer = { files: [] }

    fireEvent.dragEnter(window, { dataTransfer })
    fireEvent.dragEnter(window, { dataTransfer })
    fireEvent.dragLeave(window, { dataTransfer })
    expect(screen.getByText('Drop files here')).toBeInTheDocument()

    fireEvent.dragLeave(window, { dataTransfer })
    await waitFor(() => expect(screen.queryByText('Drop files here')).not.toBeInTheDocument())
  })

  it('does nothing when a drop has no files', async () => {
    render(<GarminToSsiDiveLogHelper />)

    fireEvent.dragEnter(window, { dataTransfer: {} })
    fireEvent.drop(window, { dataTransfer: {} })

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByRole('heading', { name: /\.fit$/i })).not.toBeInTheDocument()
  })

  it('can navigate back to the previous dive', async () => {
    const { container } = render(<GarminToSsiDiveLogHelper />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file1 = new File([suuntoOceanScubaFixture()], 'dive-1.fit')
    const file2 = new File([garminDescentScubaFixture()], 'dive-2.fit')
    Object.defineProperty(input, 'files', { value: [file1, file2], configurable: true })

    fireEvent.input(input)

    await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Next dive/i }))
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'dive-2.fit' })).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: /Previous dive/i }))

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'dive-1.fit' })).toBeInTheDocument(),
    )
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('disables the previous button on the first dive and the next button on the last dive', async () => {
    const { container } = render(<GarminToSsiDiveLogHelper />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file1 = new File([suuntoOceanScubaFixture()], 'dive-1.fit')
    const file2 = new File([garminDescentScubaFixture()], 'dive-2.fit')
    Object.defineProperty(input, 'files', { value: [file1, file2], configurable: true })

    fireEvent.input(input)
    await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument())

    expect(screen.getByRole('button', { name: /Previous dive/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Next dive/i })).not.toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /Next dive/i }))
    await waitFor(() => expect(screen.getByText('2 / 2')).toBeInTheDocument())

    expect(screen.getByRole('button', { name: /Previous dive/i })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /Next dive/i })).toBeDisabled()
  })

  it('allows dragging over the page without errors', () => {
    render(<GarminToSsiDiveLogHelper />)
    const dataTransfer = { files: [] }

    expect(() => fireEvent.dragOver(window, { dataTransfer })).not.toThrow()
  })

  it('shows a drop overlay while dragging and hides it when leaving', async () => {
    render(<GarminToSsiDiveLogHelper />)
    const dataTransfer = { files: [] }

    fireEvent.dragEnter(window, { dataTransfer })
    expect(screen.getByText('Drop files here')).toBeInTheDocument()

    fireEvent.dragLeave(window, { dataTransfer })
    await waitFor(() => expect(screen.queryByText('Drop files here')).not.toBeInTheDocument())
  })

  it('renders inside a ToolPage with the expected title', () => {
    render(<GarminToSsiDiveLogHelper />)

    expect(
      screen.getByRole('heading', { name: 'Garmin to SSI DiveLog helper' }),
    ).toBeInTheDocument()
  })

  it('explains the upload steps and that no data is stored', () => {
    render(<GarminToSsiDiveLogHelper />)

    expect(screen.getByText(/Upload or drag and drop your garmin/i)).toBeInTheDocument()
    expect(screen.getByText(/Scan the resulting QR code in the SSI app/i)).toBeInTheDocument()
    expect(screen.getByText(/This page does not store data/i)).toBeInTheDocument()
  })

  it('offers a file selector button', () => {
    render(<GarminToSsiDiveLogHelper />)

    expect(screen.getByRole('button', { name: /Select file/i })).toBeInTheDocument()
  })

  it('opens the hidden file input when the button is clicked', () => {
    const { container } = render(<GarminToSsiDiveLogHelper />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const click = vi.spyOn(input, 'click')

    fireEvent.click(screen.getByRole('button', { name: /Select file/i }))

    expect(click).toHaveBeenCalledOnce()
  })

  it('reports an error instead of crashing on an unreadable fit file', async () => {
    const { container } = render(<GarminToSsiDiveLogHelper />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([new Uint8Array([1, 2, 3, 4])], 'broken.fit')
    Object.defineProperty(input, 'files', { value: [file], configurable: true })

    fireEvent.input(input)

    await waitFor(() => expect(screen.getByText(/Unable to parse FIT file/i)).toBeInTheDocument())
    expect(screen.queryByText('Importing your dive')).not.toBeInTheDocument()
  })

  it('surfaces a non-Error parsing failure as a string error', async () => {
    const fromDive = vi.spyOn(SsiDive, 'fromDive').mockImplementation(() => {
      throw 'something went wrong'
    })

    const { container } = render(<GarminToSsiDiveLogHelper />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([suuntoOceanScubaFixture()], 'suunto-ocean-scuba.fit')
    Object.defineProperty(input, 'files', { value: [file], configurable: true })

    fireEvent.input(input)

    await waitFor(() => expect(screen.getByText('something went wrong')).toBeInTheDocument())
    fromDive.mockRestore()
  })

  it('surfaces a non-Error decoding failure as a string error', async () => {
    const isFit = vi.spyOn(Decoder.prototype, 'isFIT').mockImplementation(() => {
      throw 'decode exploded'
    })

    const { container } = render(<GarminToSsiDiveLogHelper />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File([suuntoOceanScubaFixture()], 'suunto-ocean-scuba.fit')
    Object.defineProperty(input, 'files', { value: [file], configurable: true })

    fireEvent.input(input)

    await waitFor(() => expect(screen.getByText('decode exploded')).toBeInTheDocument())
    isFit.mockRestore()
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
