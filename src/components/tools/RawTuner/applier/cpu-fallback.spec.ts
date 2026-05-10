import { describe, expect, it } from 'vitest'
import { createLinearImage, PIXEL_STRIDE } from '../domain/linear-image'
import { defaultSliderStack, mergeSliderStacks } from '../domain/slider-stack'
import { applyLinear, applyOnCpu, encodeSrgb } from './cpu-fallback'

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

describe('encodeSrgb', () => {
  it('encodes 0 to 0', () => {
    expect(encodeSrgb(0)).toBeCloseTo(0, 6)
  })

  it('encodes 1 to 1', () => {
    expect(encodeSrgb(1)).toBeCloseTo(1, 6)
  })

  it('uses the linear segment below the threshold', () => {
    expect(encodeSrgb(0.001)).toBeCloseTo(12.92 * 0.001, 6)
  })

  it('encodes mid-grey 0.18 close to 0.46 (display-referred)', () => {
    expect(encodeSrgb(0.18)).toBeCloseTo(0.461, 2)
  })

  it('clamps negative inputs to 0', () => {
    expect(encodeSrgb(-0.1)).toBe(0)
  })

  it('clamps super-bright inputs to 1', () => {
    expect(encodeSrgb(2)).toBe(1)
  })
})

describe('applyLinear (slider stack identity behaviours)', () => {
  it('returns the input unchanged for an identity stack', () => {
    const image = fillSolid(2, 2, [0.18, 0.18, 0.18, 1])
    const out = applyLinear(image, defaultSliderStack())

    for (let i = 0; i < 4; i++) {
      expect(out[i * PIXEL_STRIDE + 0]).toBeCloseTo(0.18, 5)
      expect(out[i * PIXEL_STRIDE + 1]).toBeCloseTo(0.18, 5)
      expect(out[i * PIXEL_STRIDE + 2]).toBeCloseTo(0.18, 5)
      expect(out[i * PIXEL_STRIDE + 3]).toBe(1)
    }
  })

  it('doubles linear values under +1 EV exposure', () => {
    const image = fillSolid(1, 1, [0.1, 0.2, 0.3, 1])
    const out = applyLinear(image, mergeSliderStacks(defaultSliderStack(), { exposure: 1 }))

    expect(out[0]).toBeCloseTo(0.2, 5)
    expect(out[1]).toBeCloseTo(0.4, 5)
    expect(out[2]).toBeCloseTo(0.6, 5)
  })

  it('halves linear values under -1 EV exposure', () => {
    const image = fillSolid(1, 1, [0.4, 0.4, 0.4, 1])
    const out = applyLinear(image, mergeSliderStacks(defaultSliderStack(), { exposure: -1 }))

    expect(out[0]).toBeCloseTo(0.2, 5)
  })

  it('drives near-zero pixels to zero when blacks are at -100', () => {
    const image = fillSolid(1, 1, [0.05, 0.05, 0.05, 1])
    const out = applyLinear(image, mergeSliderStacks(defaultSliderStack(), { blacks: -100 }))

    expect(out[0]).toBe(0)
  })

  it('lifts near-white pixels toward 1 when whites are positive', () => {
    const image = fillSolid(1, 1, [0.9, 0.9, 0.9, 1])
    const out = applyLinear(image, mergeSliderStacks(defaultSliderStack(), { whites: 50 }))

    expect(out[0]).toBeGreaterThan(0.9)
  })

  it('warms an image when temp is positive', () => {
    const image = fillSolid(1, 1, [0.5, 0.5, 0.5, 1])
    const out = applyLinear(image, mergeSliderStacks(defaultSliderStack(), { temp: 100 }))

    expect(out[0]).toBeGreaterThan(0.5)
    expect(out[2]).toBeLessThan(0.5)
  })

  it('cools an image when temp is negative', () => {
    const image = fillSolid(1, 1, [0.5, 0.5, 0.5, 1])
    const out = applyLinear(image, mergeSliderStacks(defaultSliderStack(), { temp: -100 }))

    expect(out[0]).toBeLessThan(0.5)
    expect(out[2]).toBeGreaterThan(0.5)
  })

  it('tints magenta when tint is positive (G drops below R/B)', () => {
    const image = fillSolid(1, 1, [0.5, 0.5, 0.5, 1])
    const out = applyLinear(image, mergeSliderStacks(defaultSliderStack(), { tint: 100 }))

    expect(out[1]).toBeLessThan(out[0])
    expect(out[1]).toBeLessThan(out[2])
  })

  it('expands distance from mid-grey when contrast is positive', () => {
    const dark = applyLinear(
      fillSolid(1, 1, [0.2, 0.2, 0.2, 1]),
      mergeSliderStacks(defaultSliderStack(), { contrast: 100 }),
    )
    const bright = applyLinear(
      fillSolid(1, 1, [0.8, 0.8, 0.8, 1]),
      mergeSliderStacks(defaultSliderStack(), { contrast: 100 }),
    )

    expect(dark[0]).toBeLessThan(0.2)
    expect(bright[0]).toBeGreaterThan(0.8)
  })

  it('passes alpha through unchanged', () => {
    const image = fillSolid(1, 1, [0.5, 0.5, 0.5, 0.7])
    const out = applyLinear(image, mergeSliderStacks(defaultSliderStack(), { exposure: 2 }))

    expect(out[3]).toBeCloseTo(0.7, 5)
  })

  it('applies a tone curve as piecewise linear interpolation', () => {
    const image = fillSolid(1, 1, [0.5, 0.5, 0.5, 1])
    const out = applyLinear(
      image,
      mergeSliderStacks(defaultSliderStack(), {
        curvePoints: [
          { x: 0, y: 0 },
          { x: 0.5, y: 0.3 },
          { x: 1, y: 1 },
        ],
      }),
    )

    expect(out[0]).toBeCloseTo(0.3, 5)
  })

  it('clamps tone curve at the upper anchor for super-bright inputs (after exposure)', () => {
    // 0.6 * 2^2 = 2.4 → out of [0,1]; curve plateau at y=0.7 should clamp the output.
    const image = fillSolid(1, 1, [0.6, 0.6, 0.6, 1])
    const out = applyLinear(
      image,
      mergeSliderStacks(defaultSliderStack(), {
        exposure: 2,
        curvePoints: [
          { x: 0, y: 0 },
          { x: 1, y: 0.7 },
        ],
      }),
    )

    expect(out[0]).toBeCloseTo(0.7, 5)
  })

  it('boosts saturation by widening the spread around the per-pixel mean', () => {
    const image = fillSolid(1, 1, [0.6, 0.4, 0.4, 1])
    const out = applyLinear(image, mergeSliderStacks(defaultSliderStack(), { saturation: 50 }))

    expect(out[0]).toBeGreaterThan(0.6)
    expect(out[1]).toBeLessThan(0.4)
    expect(out[2]).toBeLessThan(0.4)
  })
})

describe('applyOnCpu', () => {
  it('returns a sRGB-encoded RGBA Uint8ClampedArray of the right size', () => {
    const image = fillSolid(3, 2, [0.18, 0.18, 0.18, 1])
    const out = applyOnCpu(image, defaultSliderStack())

    expect(out).toBeInstanceOf(Uint8ClampedArray)
    expect(out.length).toBe(3 * 2 * PIXEL_STRIDE)
    // 0.18 linear ≈ 0.461 sRGB ≈ 117 in 8-bit
    expect(out[0]).toBeGreaterThanOrEqual(116)
    expect(out[0]).toBeLessThanOrEqual(119)
    expect(out[3]).toBe(255)
  })

  it('clamps super-bright outputs to 255', () => {
    const image = fillSolid(1, 1, [3, 3, 3, 1])
    const out = applyOnCpu(image, defaultSliderStack())

    expect(out[0]).toBe(255)
    expect(out[1]).toBe(255)
    expect(out[2]).toBe(255)
  })

  it('clamps negative outputs to 0', () => {
    const image = fillSolid(1, 1, [0.05, 0.05, 0.05, 1])
    const out = applyOnCpu(image, mergeSliderStacks(defaultSliderStack(), { blacks: -100 }))

    expect(out[0]).toBe(0)
  })
})
