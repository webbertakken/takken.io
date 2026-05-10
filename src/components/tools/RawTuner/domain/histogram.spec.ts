import { describe, expect, it } from 'vitest'
import {
  HISTOGRAM_BUCKETS,
  clipFractions,
  histogram,
  meanLuma,
  percentile,
  type Channel,
} from './histogram'
import { createLinearImage, PIXEL_STRIDE } from './linear-image'

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

const fillRamp = (channel: 'r' | 'g' | 'b', size: number) => {
  const image = createLinearImage(size, 1)
  for (let i = 0; i < size; i++) {
    const v = i / (size - 1)
    const idx = i * PIXEL_STRIDE
    image.data[idx + 0] = channel === 'r' ? v : 0
    image.data[idx + 1] = channel === 'g' ? v : 0
    image.data[idx + 2] = channel === 'b' ? v : 0
    image.data[idx + 3] = 1
  }
  return image
}

describe('histogram', () => {
  it('puts every pixel of a solid image in a single bucket', () => {
    const image = fillSolid(8, 8, [0.5, 0.5, 0.5, 1])
    const hist = histogram(image, 'r')

    expect(hist.length).toBe(HISTOGRAM_BUCKETS)
    expect(hist[Math.floor(0.5 * HISTOGRAM_BUCKETS)]).toBe(64)
    expect(hist.reduce((a, b) => a + b, 0)).toBe(64)
  })

  it('saturates super-bright values into the top bucket', () => {
    const image = fillSolid(4, 4, [4, 4, 4, 1])
    const hist = histogram(image, 'r')

    expect(hist[HISTOGRAM_BUCKETS - 1]).toBe(16)
  })

  it('clips negative values into the bottom bucket', () => {
    const image = fillSolid(4, 4, [-0.2, -0.2, -0.2, 1])
    const hist = histogram(image, 'r')

    expect(hist[0]).toBe(16)
  })

  it('distributes a ramp across roughly all buckets', () => {
    const image = fillRamp('r', HISTOGRAM_BUCKETS)
    const hist = histogram(image, 'r')

    expect(hist.reduce((a, b) => a + b, 0)).toBe(HISTOGRAM_BUCKETS)
    const occupiedBuckets = hist.filter((b) => b > 0).length
    expect(occupiedBuckets).toBe(HISTOGRAM_BUCKETS)
  })

  it('reads the right channel', () => {
    const image = fillSolid(2, 2, [1, 0, 0, 1])
    const histR = histogram(image, 'r')
    const histG = histogram(image, 'g')

    expect(histR[HISTOGRAM_BUCKETS - 1]).toBe(4)
    expect(histG[0]).toBe(4)
  })

  it('computes a luma channel via Rec.709', () => {
    const image = fillSolid(2, 2, [1, 1, 1, 1])
    const hist = histogram(image, 'luma')

    expect(hist[HISTOGRAM_BUCKETS - 1]).toBe(4)
  })

  it.each(['r', 'g', 'b', 'luma'] as readonly Channel[])(
    'is invariant to image dimensions for channel %s',
    (channel) => {
      const wide = fillSolid(16, 1, [0.25, 0.5, 0.75, 1])
      const tall = fillSolid(1, 16, [0.25, 0.5, 0.75, 1])

      expect([...histogram(wide, channel)]).toEqual([...histogram(tall, channel)])
    },
  )
})

describe('percentile', () => {
  it('returns the lowest occupied value for p=0', () => {
    const hist = histogram(fillRamp('r', HISTOGRAM_BUCKETS), 'r')

    expect(percentile(hist, 0)).toBeCloseTo(0, 3)
  })

  it('returns the highest occupied value for p=1', () => {
    const hist = histogram(fillRamp('r', HISTOGRAM_BUCKETS), 'r')

    expect(percentile(hist, 1)).toBeCloseTo(1, 2)
  })

  it('returns the midpoint of a uniform ramp at p=0.5', () => {
    const hist = histogram(fillRamp('r', HISTOGRAM_BUCKETS), 'r')

    expect(percentile(hist, 0.5)).toBeCloseTo(0.5, 1)
  })

  it('throws when p is outside [0,1]', () => {
    const hist = new Uint32Array(HISTOGRAM_BUCKETS)
    hist[0] = 1

    expect(() => percentile(hist, -0.1)).toThrow(RangeError)
    expect(() => percentile(hist, 1.1)).toThrow(RangeError)
  })

  it('throws when the histogram is empty', () => {
    expect(() => percentile(new Uint32Array(HISTOGRAM_BUCKETS), 0.5)).toThrow(/empty/)
  })
})

describe('clipFractions', () => {
  it('reports zero clipping on a midtone-only image', () => {
    const image = fillSolid(8, 8, [0.5, 0.5, 0.5, 1])

    expect(clipFractions(image)).toEqual({ low: 0, high: 0 })
  })

  it('reports highlight clipping when any channel exceeds the threshold', () => {
    const image = fillSolid(10, 10, [1.0, 0.5, 0.5, 1])
    const { high, low } = clipFractions(image, { highThreshold: 0.99, lowThreshold: 0.01 })

    expect(high).toBe(1)
    expect(low).toBe(0)
  })

  it('reports shadow clipping when any channel is below the threshold', () => {
    const image = fillSolid(10, 10, [0, 0, 0, 1])
    const { high, low } = clipFractions(image, { highThreshold: 0.99, lowThreshold: 0.01 })

    expect(high).toBe(0)
    expect(low).toBe(1)
  })

  it('counts a pixel only once even if multiple channels clip', () => {
    const image = fillSolid(4, 4, [1.2, 1.2, 1.2, 1])
    const { high } = clipFractions(image, { highThreshold: 0.99, lowThreshold: 0.01 })

    expect(high).toBe(1)
  })
})

describe('meanLuma', () => {
  it('returns the Rec.709 luma average', () => {
    const image = fillSolid(2, 2, [1, 0, 0, 1])

    expect(meanLuma(image)).toBeCloseTo(0.2126, 4)
  })

  it('clamps to a non-negative value on slightly negative inputs', () => {
    const image = fillSolid(2, 2, [-0.01, -0.01, -0.01, 1])

    expect(meanLuma(image)).toBe(0)
  })
})
