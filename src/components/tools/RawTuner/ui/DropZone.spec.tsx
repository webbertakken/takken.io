import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DropZone from './DropZone'

const buildFile = (name: string, type = 'image/jpeg') => new File(['fake-bytes'], name, { type })

describe('DropZone', () => {
  it('renders an instructional label and a hidden file input', () => {
    render(<DropZone onFile={vi.fn()} />)

    expect(screen.getByText(/drop a raw or jpeg/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Pick a RAW or JPEG file')).toBeInTheDocument()
  })

  it('calls onFile when a file is selected via the input', () => {
    const onFile = vi.fn()
    render(<DropZone onFile={onFile} />)
    const file = buildFile('photo.jpg')

    fireEvent.change(screen.getByLabelText('Pick a RAW or JPEG file'), {
      target: { files: [file] },
    })

    expect(onFile).toHaveBeenCalledTimes(1)
    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('calls onFile when a file is dropped into the zone', () => {
    const onFile = vi.fn()
    render(<DropZone onFile={onFile} />)
    const file = buildFile('photo.cr2', 'application/octet-stream')

    const zone = screen.getByRole('button', { name: /drop a raw or jpeg/i })
    fireEvent.drop(zone, { dataTransfer: { files: [file] } })

    expect(onFile).toHaveBeenCalledWith(file)
  })

  it('does not invoke onFile when no files are present in the drop', () => {
    const onFile = vi.fn()
    render(<DropZone onFile={onFile} />)
    const zone = screen.getByRole('button', { name: /drop a raw or jpeg/i })
    fireEvent.drop(zone, { dataTransfer: { files: [] } })

    expect(onFile).not.toHaveBeenCalled()
  })

  it('flags drag-over state for accessible focus visibility', () => {
    render(<DropZone onFile={vi.fn()} />)
    const zone = screen.getByRole('button', { name: /drop a raw or jpeg/i })

    fireEvent.dragOver(zone, { dataTransfer: { files: [] } })
    expect(zone).toHaveAttribute('data-drag-over', 'true')

    fireEvent.dragLeave(zone)
    expect(zone).toHaveAttribute('data-drag-over', 'false')
  })

  it('triggers the file picker on Enter / Space keypresses', () => {
    render(<DropZone onFile={vi.fn()} />)
    const zone = screen.getByRole('button', { name: /drop a raw or jpeg/i })
    const input = screen.getByLabelText('Pick a RAW or JPEG file') as HTMLInputElement

    const click = vi.spyOn(input, 'click')

    fireEvent.keyDown(zone, { key: 'Enter' })
    expect(click).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(zone, { key: ' ' })
    expect(click).toHaveBeenCalledTimes(2)

    fireEvent.keyDown(zone, { key: 'Tab' })
    expect(click).toHaveBeenCalledTimes(2)
  })
})
