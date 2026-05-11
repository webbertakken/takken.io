import { describe, expect, it } from 'vitest'
import { applyLinear } from '../applier/cpu-fallback'
import { meanLuma, percentile, histogram } from '../domain/histogram'
import { createLinearImage, PIXEL_STRIDE, type LinearImage } from '../domain/linear-image'
import { analyseImage } from './analyse'
import { autoTune } from './auto-tune'

const ramp = (size: number) => {
  const image = createLinearImage(size, 1)
  for (let i = 0; i < size; i++) {
    const v = i / (size - 1)
    image.data.set([v, v, v, 1], i * PIXEL_STRIDE)
  }
  return image
}

const warmRamp = (size: number) => {
  const image = createLinearImage(size, 1)
  for (let i = 0; i < size; i++) {
    const v = i / (size - 1)
    image.data.set([v * 0.7 + 0.1, v * 0.5, v * 0.3, 1], i * PIXEL_STRIDE)
  }
  return image
}

const wrap = (data: Float32Array, width: number, height: number): LinearImage => ({
  width,
  height,
  data,
})

describe('Phase 1 round-trip: analyse → auto-tune → apply', () => {
  it('pulls a 0..1 grayscale ramp toward mid-grey 0.18 with no shadow/highlight clipping', () => {
    const image = ramp(256)
    const analysis = analyseImage(image)
    const sliders = autoTune(analysis)

    const linearOut = applyLinear(image, sliders)
    const tuned = wrap(linearOut, image.width, image.height)
    const tunedAnalysis = analyseImage(tuned)

    expect(tunedAnalysis.midGrey).toBeCloseTo(0.18, 1)
    expect(tunedAnalysis.clippedShadowsPct).toBeLessThan(0.05)
    expect(tunedAnalysis.clippedHighlightsPct).toBeLessThan(0.05)
  })

  it('reduces a warm cast on a coloured ramp', () => {
    const image = warmRamp(256)
    const before = analyseImage(image)
    const sliders = autoTune(before)
    const tuned = wrap(applyLinear(image, sliders), image.width, image.height)
    const after = analyseImage(tuned)

    expect(Math.abs(after.wbTemp)).toBeLessThan(Math.abs(before.wbTemp))
  })

  it('moves the mean luma of a dark image upward', () => {
    const image = createLinearImage(64, 1)
    for (let i = 0; i < 64; i++) {
      const v = (i / 63) * 0.1
      image.data.set([v, v, v, 1], i * PIXEL_STRIDE)
    }

    const before = meanLuma(image)
    const sliders = autoTune(analyseImage(image))
    const after = meanLuma(wrap(applyLinear(image, sliders), image.width, image.height))

    expect(after).toBeGreaterThan(before * 1.5)
  })

  it('preserves a pre-tuned image (auto-tune is near-idempotent)', () => {
    const image = ramp(256)
    const firstSliders = autoTune(analyseImage(image))
    const tuned = wrap(applyLinear(image, firstSliders), image.width, image.height)
    const secondSliders = autoTune(analyseImage(tuned))

    expect(Math.abs(secondSliders.exposure)).toBeLessThan(0.5)
    expect(Math.abs(secondSliders.temp)).toBeLessThan(15)
    expect(Math.abs(secondSliders.tint)).toBeLessThan(15)
  })

  it('histogram of the tuned ramp covers the dynamic range without spiking at the ends', () => {
    const image = ramp(256)
    const sliders = autoTune(analyseImage(image))
    const tuned = wrap(applyLinear(image, sliders), image.width, image.height)
    const hist = histogram(tuned, 'luma')
    const total = hist.reduce((a, b) => a + b, 0)

    // No more than 5% of pixels in the bottom or top bucket.
    expect(hist[0] / total).toBeLessThan(0.05)
    expect(hist[hist.length - 1] / total).toBeLessThan(0.05)

    // Median sits near 0.18.
    expect(percentile(hist, 0.5)).toBeCloseTo(0.18, 1)
  })
})
