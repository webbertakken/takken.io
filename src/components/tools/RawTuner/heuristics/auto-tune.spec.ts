import { describe, expect, it } from 'vitest'
import type { ImageAnalysis } from './analyse'
import { autoTune } from './auto-tune'

const baseAnalysis: ImageAnalysis = {
  blackPoint: 0,
  whitePoint: 1,
  midGrey: 0.18,
  wbTemp: 0,
  wbTint: 0,
  clippedHighlightsPct: 0,
  clippedShadowsPct: 0,
}

describe('autoTune', () => {
  it('returns a near-identity slider stack for an already-perfect analysis', () => {
    const stack = autoTune(baseAnalysis)

    expect(stack.exposure).toBeCloseTo(0, 3)
    expect(stack.whites).toBeCloseTo(0, 3)
    expect(stack.blacks).toBeCloseTo(0, 3)
    expect(stack.temp).toBeCloseTo(0, 3)
    expect(stack.tint).toBeCloseTo(0, 3)
  })

  it('lifts exposure when the image is underexposed', () => {
    const stack = autoTune({ ...baseAnalysis, midGrey: 0.045 })

    expect(stack.exposure).toBeGreaterThan(1.5)
    expect(stack.exposure).toBeLessThanOrEqual(3)
  })

  it('reduces exposure when the image is overexposed', () => {
    const stack = autoTune({ ...baseAnalysis, midGrey: 0.6 })

    expect(stack.exposure).toBeLessThan(-1)
    expect(stack.exposure).toBeGreaterThanOrEqual(-3)
  })

  it('clamps exposure to ±3 EV on extreme inputs', () => {
    // 0.18 / 2^3 = 0.0225 is the boundary below which we clamp to +3 EV.
    expect(autoTune({ ...baseAnalysis, midGrey: 0.001 }).exposure).toBe(3)
    // Above 1.44 we clamp to -3 EV; values >1 are valid in HDR linear space.
    expect(autoTune({ ...baseAnalysis, midGrey: 2 }).exposure).toBe(-3)
  })

  it('handles a pure-black image without producing NaN/Infinity', () => {
    const stack = autoTune({ ...baseAnalysis, midGrey: 0 })

    expect(Number.isFinite(stack.exposure)).toBe(true)
    expect(stack.exposure).toBe(3)
  })

  it('pushes whites slider positive when whitePoint is below 1', () => {
    const stack = autoTune({ ...baseAnalysis, whitePoint: 0.7 })

    expect(stack.whites).toBeGreaterThan(0)
    expect(stack.whites).toBeLessThanOrEqual(100)
  })

  it('pushes blacks slider negative when blackPoint is above 0', () => {
    const stack = autoTune({ ...baseAnalysis, blackPoint: 0.1 })

    expect(stack.blacks).toBeLessThan(0)
    expect(stack.blacks).toBeGreaterThanOrEqual(-100)
  })

  it('cools the temp slider on a warm-cast image', () => {
    const stack = autoTune({ ...baseAnalysis, wbTemp: 0.3 })

    expect(stack.temp).toBeLessThan(0)
  })

  it('warms the temp slider on a cool-cast image', () => {
    const stack = autoTune({ ...baseAnalysis, wbTemp: -0.3 })

    expect(stack.temp).toBeGreaterThan(0)
  })

  it('pushes tint magenta-ward on a green-cast image', () => {
    const stack = autoTune({ ...baseAnalysis, wbTint: 0.2 })

    expect(stack.tint).toBeLessThan(0)
  })

  it('pushes tint green-ward on a magenta-cast image', () => {
    const stack = autoTune({ ...baseAnalysis, wbTint: -0.2 })

    expect(stack.tint).toBeGreaterThan(0)
  })

  it('clamps WB sliders to ±100', () => {
    const extremeWarm = autoTune({ ...baseAnalysis, wbTemp: 5, wbTint: 5 })
    const extremeCool = autoTune({ ...baseAnalysis, wbTemp: -5, wbTint: -5 })

    expect(extremeWarm.temp).toBe(-100)
    expect(extremeWarm.tint).toBe(-100)
    expect(extremeCool.temp).toBe(100)
    expect(extremeCool.tint).toBe(100)
  })

  it('preserves neutral defaults for fields it does not adjust', () => {
    const stack = autoTune(baseAnalysis)

    expect(stack.contrast).toBe(0)
    expect(stack.vibrance).toBe(0)
    expect(stack.saturation).toBe(0)
    expect(stack.curvePoints).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ])
  })

  it('refuses to push exposure further when the image already clips highlights heavily', () => {
    const clippy = autoTune({ ...baseAnalysis, midGrey: 0.05, clippedHighlightsPct: 0.2 })
    const clean = autoTune({ ...baseAnalysis, midGrey: 0.05, clippedHighlightsPct: 0 })

    expect(clippy.exposure).toBeLessThan(clean.exposure)
  })
})
