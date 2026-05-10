import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLinearImage, PIXEL_STRIDE } from '../domain/linear-image'
import HistogramView from './HistogramView'

interface FakeContext {
  fillStyle: string
  globalAlpha: number
  fillRect: ReturnType<typeof vi.fn>
  clearRect: ReturnType<typeof vi.fn>
}

const installCanvasMock = (): { ctx: FakeContext; restore: () => void } => {
  const ctx: FakeContext = {
    fillStyle: '#000',
    globalAlpha: 1,
    fillRect: vi.fn(),
    clearRect: vi.fn(),
  }
  const original = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx) as unknown as typeof original
  return {
    ctx,
    restore: () => {
      HTMLCanvasElement.prototype.getContext = original
    },
  }
}

const buildImage = () => {
  const image = createLinearImage(8, 8)
  for (let i = 0; i < image.width * image.height; i++) {
    image.data.set([0.5, 0.3, 0.7, 1], i * PIXEL_STRIDE)
  }
  return image
}

const restorers: (() => void)[] = []
afterEach(() => {
  while (restorers.length) restorers.pop()?.()
})

describe('HistogramView', () => {
  it('renders an accessible canvas of the requested size', () => {
    const { restore } = installCanvasMock()
    restorers.push(restore)

    const { container } = render(<HistogramView image={buildImage()} width={256} height={120} />)
    const canvas = container.querySelector('canvas')!

    expect(canvas).toBeInTheDocument()
    expect(canvas.getAttribute('aria-label')).toBe('Histogram')
    expect(canvas.width).toBe(256)
    expect(canvas.height).toBe(120)
  })

  it('clears and draws three coloured channels', () => {
    const { ctx, restore } = installCanvasMock()
    restorers.push(restore)

    render(<HistogramView image={buildImage()} width={64} height={32} />)

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 64, 32)
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('renders an empty canvas when no image is supplied', () => {
    const { ctx, restore } = installCanvasMock()
    restorers.push(restore)

    render(<HistogramView image={null} width={32} height={16} />)

    expect(ctx.fillRect).not.toHaveBeenCalled()
    expect(ctx.clearRect).toHaveBeenCalled()
  })
})
