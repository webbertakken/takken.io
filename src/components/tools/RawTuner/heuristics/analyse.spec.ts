import { describe, expect, it } from 'vitest'
import { createLinearImage, PIXEL_STRIDE } from '../domain/linear-image'
import { analyseImage } from './analyse'

const fillSolid = (
  width: number,
  height: number,
  rgba: readonly [number, number, number, number],
) => {
  const image = createLinearImage(width, height)
  for (let i = 0; i < width * height; i++) {
    image.data[i * PIXEL_STRIDE + 0] = rgba[0]
    image.data[i * PIXEL_STRIDE + 1] = rgba[1]
    image.data[i * PIXEL_STRIDE + 2] = rgba[2]
    image.data[i * PIXEL_STRIDE + 3] = rgba[3]
  }
  return image
}

const fillRamp = (size: number) => {
  const image = createLinearImage(size, 1)
  for (let i = 0; i < size; i++) {
    const v = i / (size - 1)
    image.data.set([v, v, v, 1], i * PIXEL_STRIDE)
  }
  return image
}

describe('analyseImage', () => {
  it('reports midGrey near 0.18 on a well-exposed neutral image', () => {
    const result = analyseImage(fillSolid(8, 8, [0.18, 0.18, 0.18, 1]))

    expect(result.midGrey).toBeCloseTo(0.18, 2)
    expect(result.clippedHighlightsPct).toBe(0)
    expect(result.clippedShadowsPct).toBe(0)
  })

  it('reports a low midGrey on an underexposed image', () => {
    const result = analyseImage(fillSolid(8, 8, [0.04, 0.04, 0.04, 1]))

    expect(result.midGrey).toBeLessThan(0.05)
  })

  it('reports a high midGrey on an overexposed image', () => {
    const result = analyseImage(fillSolid(8, 8, [0.92, 0.92, 0.92, 1]))

    expect(result.midGrey).toBeGreaterThan(0.9)
  })

  it('flags highlight clipping when nearly all pixels are blown', () => {
    const result = analyseImage(fillSolid(8, 8, [1.0, 1.0, 1.0, 1]))

    expect(result.clippedHighlightsPct).toBe(1)
    expect(result.clippedShadowsPct).toBe(0)
  })

  it('flags shadow clipping when nearly all pixels are crushed', () => {
    const result = analyseImage(fillSolid(8, 8, [0, 0, 0, 1]))

    expect(result.clippedShadowsPct).toBe(1)
    expect(result.clippedHighlightsPct).toBe(0)
  })

  it('reports neutral WB on a grayscale ramp', () => {
    const result = analyseImage(fillRamp(64))

    expect(result.wbTemp).toBeCloseTo(0, 3)
    expect(result.wbTint).toBeCloseTo(0, 3)
  })

  it('reports a positive wbTemp on a warm-cast image', () => {
    const result = analyseImage(fillSolid(8, 8, [0.6, 0.4, 0.2, 1]))

    expect(result.wbTemp).toBeGreaterThan(0)
  })

  it('reports a negative wbTemp on a cool-cast image', () => {
    const result = analyseImage(fillSolid(8, 8, [0.2, 0.4, 0.6, 1]))

    expect(result.wbTemp).toBeLessThan(0)
  })

  it('reports a positive wbTint on a green-cast image', () => {
    const result = analyseImage(fillSolid(8, 8, [0.3, 0.6, 0.3, 1]))

    expect(result.wbTint).toBeGreaterThan(0)
  })

  it('reports a negative wbTint on a magenta-cast image', () => {
    const result = analyseImage(fillSolid(8, 8, [0.6, 0.3, 0.6, 1]))

    expect(result.wbTint).toBeLessThan(0)
  })

  it('puts blackPoint near 0 and whitePoint near 1 on a full-range ramp', () => {
    const result = analyseImage(fillRamp(256))

    expect(result.blackPoint).toBeLessThan(0.05)
    expect(result.whitePoint).toBeGreaterThan(0.95)
  })

  it('puts blackPoint == whitePoint near the value of a constant image', () => {
    const result = analyseImage(fillSolid(8, 8, [0.42, 0.42, 0.42, 1]))

    expect(result.blackPoint).toBeCloseTo(0.42, 1)
    expect(result.whitePoint).toBeCloseTo(0.42, 1)
  })
})
