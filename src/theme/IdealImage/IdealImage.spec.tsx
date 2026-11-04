import { act, fireEvent } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '../../test/test-utils'
import IdealImageWrapper from './index'

type Img = ComponentProps<typeof IdealImageWrapper>['img']

const enlarge = () => fireEvent.click(screen.getByRole('button', { name: /A sketch/ }))
const enlargedImage = () => screen.getByRole('dialog').querySelector('img') as HTMLImageElement

describe('IdealImageWrapper', () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
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

  it('styles the inline image with the given class, not the enlarged one', () => {
    renderWithProviders(
      <IdealImageWrapper img="/sketch.png" alt="A sketch" className="rounded-lg" />,
    )

    enlarge()

    expect(screen.getByRole('button', { name: 'A sketch' }).querySelector('img')).toHaveClass(
      'rounded-lg',
    )
    expect(enlargedImage()).not.toHaveClass('rounded-lg')
  })

  it('closes the enlarged image when it is clicked', () => {
    renderWithProviders(<IdealImageWrapper img="/sketch.png" alt="A sketch" />)
    enlarge()

    fireEvent.click(enlargedImage())

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the source both inline and when enlarged', () => {
    renderWithProviders(
      <IdealImageWrapper img="/sketch.png" alt="A sketch" source={<span>By Webber</span>} />,
    )
    enlarge()

    expect(screen.getAllByText('By Webber')).toHaveLength(2)
  })

  it.each<[string, Img, string]>([
    [
      'the largest generated size',
      { src: { src: '/small.png', images: [{ path: '/small.png' }, { path: '/large.png' }] } },
      '/large.png',
    ],
    ['the source of an unsized image', { src: { src: '/single.png' } }, '/single.png'],
    ['a plain source string', { src: '/plain.png' } as unknown as Img, '/plain.png'],
  ])('enlarges %s', (_, img, expected) => {
    renderWithProviders(<IdealImageWrapper img={img} alt="A sketch" />)
    enlarge()

    expect(enlargedImage()).toHaveAttribute('src', expected)
  })

  it('sizes the enlarged image to the original aspect ratio', () => {
    const loaded: Array<{ onload: () => void }> = []
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 400
        naturalHeight = 500
        src = ''
        onload = () => {}
        constructor() {
          loaded.push(this)
        }
      },
    )
    renderWithProviders(<IdealImageWrapper img="/sketch.png" alt="A sketch" />)

    act(() => loaded.forEach((image) => image.onload()))
    enlarge()

    expect(enlargedImage().style.width).toContain('0.8 *')
  })
})
