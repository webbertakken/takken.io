import { describe, expect, it } from 'vitest'
import { downsample } from './downsample'
import { createLinearImage, PIXEL_STRIDE } from './linear-image'

describe('downsample', () => {
  it('returns the same image when it already fits the cap', () => {
    const image = createLinearImage(2, 2)
    image.data.fill(0.5)

    const result = downsample(image, 1024)

    expect(result).toBe(image)
  })

  it('preserves a single solid colour after downsampling', () => {
    const image = createLinearImage(2048, 2048)
    for (let i = 0; i < 2048 * 2048; i++) {
      image.data.set([0.5, 0.5, 0.5, 1], i * PIXEL_STRIDE)
    }

    const result = downsample(image, 1024)

    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(1024)
    expect(result.data[0]).toBeCloseTo(0.5, 4)
    expect(result.data[result.data.length - 4]).toBeCloseTo(0.5, 4)
  })

  it('preserves the aspect ratio (longer-side cap)', () => {
    const image = createLinearImage(4000, 2000)
    image.data.fill(0.4)

    const result = downsample(image, 1000)

    expect(result.width).toBe(1000)
    expect(result.height).toBe(500)
  })

  it('keeps both dimensions when the longer side is already <= cap', () => {
    const image = createLinearImage(800, 600)
    image.data.fill(0.2)

    const result = downsample(image, 1000)

    expect(result).toBe(image)
  })

  it('produces an output of width*height*4 floats', () => {
    const image = createLinearImage(2048, 1024)
    image.data.fill(0.3)

    const result = downsample(image, 256)

    expect(result.data.length).toBe(result.width * result.height * PIXEL_STRIDE)
  })

  it('approximates a horizontal gradient (left half dark, right half bright)', () => {
    const image = createLinearImage(1024, 1)
    for (let x = 0; x < image.width; x++) {
      const v = x < image.width / 2 ? 0.0 : 1.0
      image.data.set([v, v, v, 1], x * PIXEL_STRIDE)
    }

    const result = downsample(image, 4)

    // First pixel should be dark; last should be bright; middle should mix.
    expect(result.data[0]).toBeLessThan(0.1)
    expect(result.data[(result.width - 1) * PIXEL_STRIDE]).toBeGreaterThan(0.9)
  })
})
