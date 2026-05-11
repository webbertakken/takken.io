import { describe, expect, it } from 'vitest'
import {
  COLOR_CHANNELS,
  defaultSliderStack,
  mergeSliderStacks,
  type SliderStack,
} from './slider-stack'

describe('defaultSliderStack', () => {
  it('returns a neutral identity stack', () => {
    const stack = defaultSliderStack()

    expect(stack.exposure).toBe(0)
    expect(stack.contrast).toBe(0)
    expect(stack.highlights).toBe(0)
    expect(stack.shadows).toBe(0)
    expect(stack.whites).toBe(0)
    expect(stack.blacks).toBe(0)
    expect(stack.temp).toBe(0)
    expect(stack.tint).toBe(0)
    expect(stack.vibrance).toBe(0)
    expect(stack.saturation).toBe(0)
  })

  it('has an identity tone curve with two anchor points', () => {
    const stack = defaultSliderStack()

    expect(stack.curvePoints).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ])
  })

  it('has neutral HSL adjustments for every colour channel', () => {
    const stack = defaultSliderStack()

    for (const channel of COLOR_CHANNELS) {
      expect(stack.hsl[channel]).toEqual({ hue: 0, saturation: 0, luminance: 0 })
    }
  })

  it('returns a fresh object each call so mutations stay local', () => {
    const a = defaultSliderStack()
    const b = defaultSliderStack()

    expect(a).not.toBe(b)
    expect(a.curvePoints).not.toBe(b.curvePoints)
    expect(a.hsl).not.toBe(b.hsl)
  })
})

describe('mergeSliderStacks', () => {
  it('returns the base unchanged when the patch is empty', () => {
    const base = defaultSliderStack()
    const merged = mergeSliderStacks(base, {})

    expect(merged).toEqual(base)
  })

  it('overrides scalar fields when the patch defines them', () => {
    const base = defaultSliderStack()
    const merged = mergeSliderStacks(base, { exposure: 1.2, contrast: 30 })

    expect(merged.exposure).toBe(1.2)
    expect(merged.contrast).toBe(30)
    expect(merged.shadows).toBe(0)
  })

  it('replaces curvePoints atomically (a curve is one decision, not a merge)', () => {
    const base = defaultSliderStack()
    const newCurve = [
      { x: 0, y: 0.05 },
      { x: 0.5, y: 0.6 },
      { x: 1, y: 0.95 },
    ]
    const merged = mergeSliderStacks(base, { curvePoints: newCurve })

    expect(merged.curvePoints).toEqual(newCurve)
  })

  it('deep-merges HSL: undefined channels keep base values, defined channels merge their fields', () => {
    const base = mergeSliderStacks(defaultSliderStack(), {
      hsl: { red: { hue: 5, saturation: 10, luminance: 0 } },
    })

    const merged = mergeSliderStacks(base, {
      hsl: { red: { saturation: 20 }, blue: { luminance: -15 } },
    })

    expect(merged.hsl.red).toEqual({ hue: 5, saturation: 20, luminance: 0 })
    expect(merged.hsl.blue).toEqual({ hue: 0, saturation: 0, luminance: -15 })
    expect(merged.hsl.green).toEqual({ hue: 0, saturation: 0, luminance: 0 })
  })

  it('does not mutate the input base', () => {
    const base = defaultSliderStack()
    const snapshot = JSON.parse(JSON.stringify(base)) as SliderStack

    mergeSliderStacks(base, { exposure: 2, hsl: { red: { hue: 5 } } })

    expect(base).toEqual(snapshot)
  })
})
