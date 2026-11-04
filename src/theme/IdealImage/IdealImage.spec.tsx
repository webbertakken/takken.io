import { fireEvent } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../test/test-utils'
import IdealImageWrapper from './index'

describe('IdealImageWrapper', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true
    }
  })

  it('is reachable with the keyboard', () => {
    renderWithProviders(<IdealImageWrapper img="/sketch.png" alt="A sketch" />)

    expect(screen.getByRole('button', { name: 'A sketch' })).toHaveAttribute('tabindex', '0')
  })

  it.each(['Enter', ' '])('opens the enlarged image on %j', (key) => {
    renderWithProviders(<IdealImageWrapper img="/sketch.png" alt="A sketch" />)

    fireEvent.keyDown(screen.getByRole('button', { name: 'A sketch' }), { key })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('ignores other keys', () => {
    renderWithProviders(<IdealImageWrapper img="/sketch.png" alt="A sketch" />)

    fireEvent.keyDown(screen.getByRole('button', { name: 'A sketch' }), { key: 'a' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
