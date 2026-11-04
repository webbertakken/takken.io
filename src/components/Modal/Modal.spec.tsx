import { fireEvent } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '../../test/test-utils'
import Modal from './Modal'

describe('Modal', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true
    }
  })

  it('opens as a modal dialog and locks page scroll', () => {
    renderWithProviders(<Modal onCloseRequested={vi.fn()}>Content</Modal>)

    expect(screen.getByRole('dialog')).toHaveAttribute('open')
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores page scroll when it closes', () => {
    const { unmount } = renderWithProviders(<Modal onCloseRequested={vi.fn()}>Content</Modal>)

    unmount()

    expect(document.body.style.overflow).toBe('auto')
  })

  it('closes on a click that starts and ends on the backdrop', () => {
    const onCloseRequested = vi.fn()
    renderWithProviders(<Modal onCloseRequested={onCloseRequested}>Content</Modal>)
    const dialog = screen.getByRole('dialog')

    fireEvent.mouseDown(dialog)
    fireEvent.mouseUp(dialog)

    expect(onCloseRequested).toHaveBeenCalledOnce()
  })

  it('stays open when a click starts inside and ends on the backdrop', () => {
    const onCloseRequested = vi.fn()
    renderWithProviders(
      <Modal onCloseRequested={onCloseRequested}>
        <p>Content</p>
      </Modal>,
    )

    fireEvent.mouseDown(screen.getByText('Content'))
    fireEvent.mouseUp(screen.getByRole('dialog'))

    expect(onCloseRequested).not.toHaveBeenCalled()
  })

  it('closes from the title bar close button', () => {
    const onCloseRequested = vi.fn()
    renderWithProviders(
      <Modal title="Details" onCloseRequested={onCloseRequested}>
        Content
      </Modal>,
    )

    fireEvent.click(screen.getByRole('button', { name: '×' }))

    expect(screen.getByRole('heading', { name: 'Details' })).toBeInTheDocument()
    expect(onCloseRequested).toHaveBeenCalledOnce()
  })

  it('shows a close button without a title when asked', () => {
    renderWithProviders(
      <Modal hasCloseButton onCloseRequested={vi.fn()}>
        Content
      </Modal>,
    )

    expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
