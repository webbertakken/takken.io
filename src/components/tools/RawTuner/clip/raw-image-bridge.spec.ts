import { describe, expect, it } from 'vitest'
import { createLinearImage, PIXEL_STRIDE } from '../domain/linear-image'
import { linearToSrgbRgb } from './raw-image-bridge'

describe('linearToSrgbRgb', () => {
  it('converts a 2x2 image to sRGB-encoded 3-channel bytes', () => {
    const image = createLinearImage(2, 2)
    image.data.set([1, 1, 1, 1, 0, 0, 0, 1, 0.18, 0.18, 0.18, 1, 0.5, 0.5, 0.5, 1])

    const result = linearToSrgbRgb(image)

    expect(result.width).toBe(2)
    expect(result.height).toBe(2)
    expect(result.data.length).toBe(2 * 2 * 3)
    expect(result.data[0]).toBe(255)
    expect(result.data[3]).toBe(0)
    expect(result.data[6]).toBeGreaterThanOrEqual(116)
    expect(result.data[6]).toBeLessThanOrEqual(119)
  })

  it('drops the alpha channel', () => {
    const image = createLinearImage(1, 1)
    image.data.set([0.5, 0.25, 0.125, 0.7])

    const result = linearToSrgbRgb(image)

    expect(result.data.length).toBe(3)
  })

  it('clamps super-bright values into 0..255', () => {
    const image = createLinearImage(1, 1)
    image.data.set([3, -1, 0.5, 1])

    const result = linearToSrgbRgb(image)

    expect(result.data[0]).toBe(255)
    expect(result.data[1]).toBe(0)
  })

  it('round-trips with srgbBytesToLinear (linear -> bytes -> linear)', async () => {
    const { srgbBytesToLinear } = await import('../decode/decode-jpeg')
    const original = createLinearImage(1, 1)
    original.data.set([0.18, 0.5, 0.05, 1])

    const bridged = linearToSrgbRgb(original)
    // Wrap RGB bytes back into a 4-channel buffer for decode-jpeg.
    const rgba = new Uint8ClampedArray(4)
    rgba[0] = bridged.data[0]
    rgba[1] = bridged.data[1]
    rgba[2] = bridged.data[2]
    rgba[3] = 255
    const back = srgbBytesToLinear(1, 1, rgba)

    for (let i = 0; i < 3; i++) {
      expect(back.data[i]).toBeCloseTo(original.data[i], 1)
    }
  })

  it('returns Uint8ClampedArray', () => {
    const image = createLinearImage(1, 1)
    image.data.set([0.5, 0.5, 0.5, 1])

    const result = linearToSrgbRgb(image)
    expect(result.data).toBeInstanceOf(Uint8ClampedArray)
  })

  it('preserves correct pixel ordering (row-major, RGB)', () => {
    const image = createLinearImage(3, 1)
    // Three pixels with distinct colours.
    image.data.set([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1])
    void PIXEL_STRIDE

    const result = linearToSrgbRgb(image)

    expect(result.data.slice(0, 3)).toEqual(new Uint8ClampedArray([255, 0, 0]))
    expect(result.data.slice(3, 6)).toEqual(new Uint8ClampedArray([0, 255, 0]))
    expect(result.data.slice(6, 9)).toEqual(new Uint8ClampedArray([0, 0, 255]))
  })
})
