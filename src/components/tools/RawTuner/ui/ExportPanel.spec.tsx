import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ExportPanel from './ExportPanel'

describe('ExportPanel', () => {
  it('renders disabled buttons until an image is loaded', () => {
    render(<ExportPanel disabled onExportJpeg={vi.fn()} onExportXmp={vi.fn()} />)

    expect(screen.getByRole('button', { name: /export jpeg/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /export \.xmp/i })).toBeDisabled()
  })

  it('emits onExportJpeg with the chosen quality', () => {
    const onExportJpeg = vi.fn()
    render(<ExportPanel disabled={false} onExportJpeg={onExportJpeg} onExportXmp={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/quality/i), { target: { value: '0.75' } })
    fireEvent.click(screen.getByRole('button', { name: /export jpeg/i }))

    expect(onExportJpeg).toHaveBeenCalledWith(0.75)
  })

  it('uses the default quality when the slider has not been touched', () => {
    const onExportJpeg = vi.fn()
    render(<ExportPanel disabled={false} onExportJpeg={onExportJpeg} onExportXmp={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /export jpeg/i }))

    expect(onExportJpeg).toHaveBeenCalledWith(0.92)
  })

  it('emits onExportXmp on the XMP button click', () => {
    const onExportXmp = vi.fn()
    render(<ExportPanel disabled={false} onExportJpeg={vi.fn()} onExportXmp={onExportXmp} />)

    fireEvent.click(screen.getByRole('button', { name: /export \.xmp/i }))

    expect(onExportXmp).toHaveBeenCalledTimes(1)
  })

  it('shows the current quality next to the slider', () => {
    render(<ExportPanel disabled={false} onExportJpeg={vi.fn()} onExportXmp={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/quality/i), { target: { value: '0.6' } })

    expect(screen.getByText('60%')).toBeInTheDocument()
  })
})
