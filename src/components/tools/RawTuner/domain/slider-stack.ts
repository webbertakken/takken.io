/**
 * The full set of slider values that describe a deterministic, reproducible
 * edit. The same `SliderStack` applied to the same `LinearImage` produces the
 * same output bytes. The applier (CPU or WebGPU) consumes this directly; the
 * heuristics auto-tuner and the preset bank both produce instances of it.
 *
 * Units follow Lightroom's conventions so that .xmp export can be a near-1:1
 * mapping:
 *   - exposure: EV stops, -5..+5
 *   - contrast / highlights / shadows / whites / blacks: -100..+100
 *   - temp / tint: -100..+100 (relative offsets; 0 = neutral as decoded)
 *   - vibrance / saturation: -100..+100
 *   - curvePoints: anchor points in [0,1] linear-output space; identity is
 *                  [(0,0),(1,1)]
 *   - hsl: per-channel hue (deg shift / 100), saturation, luminance, all
 *          -100..+100
 */
export interface CurvePoint {
  readonly x: number
  readonly y: number
}

export const COLOR_CHANNELS = [
  'red',
  'orange',
  'yellow',
  'green',
  'aqua',
  'blue',
  'purple',
  'magenta',
] as const

export type ColorChannel = (typeof COLOR_CHANNELS)[number]

export interface HslAdjustment {
  readonly hue: number
  readonly saturation: number
  readonly luminance: number
}

export interface SliderStack {
  readonly exposure: number
  readonly contrast: number
  readonly highlights: number
  readonly shadows: number
  readonly whites: number
  readonly blacks: number
  readonly temp: number
  readonly tint: number
  readonly vibrance: number
  readonly saturation: number
  readonly curvePoints: readonly CurvePoint[]
  readonly hsl: Readonly<Record<ColorChannel, HslAdjustment>>
}

const NEUTRAL_HSL: HslAdjustment = { hue: 0, saturation: 0, luminance: 0 }

const buildNeutralHsl = (): Record<ColorChannel, HslAdjustment> => {
  const result = {} as Record<ColorChannel, HslAdjustment>
  for (const channel of COLOR_CHANNELS) {
    result[channel] = { ...NEUTRAL_HSL }
  }
  return result
}

export const defaultSliderStack = (): SliderStack => ({
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  temp: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
  curvePoints: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ],
  hsl: buildNeutralHsl(),
})

export type HslPatch = Partial<Record<ColorChannel, Partial<HslAdjustment>>>

export type SliderStackPatch = Partial<
  Omit<SliderStack, 'curvePoints' | 'hsl'> & {
    curvePoints: readonly CurvePoint[]
    hsl: HslPatch
  }
>

const mergeHsl = (
  base: Readonly<Record<ColorChannel, HslAdjustment>>,
  patch: HslPatch | undefined,
): Record<ColorChannel, HslAdjustment> => {
  const result = {} as Record<ColorChannel, HslAdjustment>
  for (const channel of COLOR_CHANNELS) {
    const overlay = patch?.[channel]
    result[channel] = overlay ? { ...base[channel], ...overlay } : { ...base[channel] }
  }
  return result
}

/**
 * Apply a `SliderStackPatch` on top of `base`. Scalars are replaced when the
 * patch defines them. `curvePoints` is replaced atomically (a curve is one
 * decision). `hsl` is deep-merged channel-by-channel and field-by-field.
 *
 * Returns a fresh object; never mutates `base`.
 */
export const mergeSliderStacks = (base: SliderStack, patch: SliderStackPatch): SliderStack => {
  const { curvePoints, hsl, ...scalars } = patch
  return {
    ...base,
    ...scalars,
    curvePoints: curvePoints ?? base.curvePoints,
    hsl: mergeHsl(base.hsl, hsl),
  }
}
