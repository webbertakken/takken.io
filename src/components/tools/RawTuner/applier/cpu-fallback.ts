import { PIXEL_STRIDE, type LinearImage } from '../domain/linear-image'
import type { CurvePoint, SliderStack } from '../domain/slider-stack'

const SRGB_THRESHOLD = 0.0031308

/**
 * Linear-light → sRGB display-referred transfer function. Inputs outside
 * [0,1] are clamped.
 */
export const encodeSrgb = (linear: number): number => {
  if (linear <= 0) return 0
  if (linear >= 1) return 1
  if (linear <= SRGB_THRESHOLD) return 12.92 * linear
  return 1.055 * Math.pow(linear, 1 / 2.4) - 0.055
}

const clamp01 = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v)

/**
 * Piecewise linear interpolation through `points`. Points must be sorted by
 * `x`, span [0,1], and contain at least two entries (defaults satisfy this).
 * Inputs below the first x clamp to its y; inputs above the last x clamp to
 * the last y.
 */
const evalCurve = (value: number, points: readonly CurvePoint[]): number => {
  if (value <= points[0].x) return points[0].y
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    if (value <= b.x) {
      const t = (value - a.x) / (b.x - a.x)
      return a.y + (b.y - a.y) * t
    }
  }
  return points[points.length - 1].y
}

const applyWhitesBlacks = (c: number, whites: number, blacks: number): number => {
  const w = whites / 200
  const k = blacks / 200
  const c2 = c * c
  const inv2 = (1 - c) * (1 - c)
  return c + w * c2 + k * inv2
}

const applyHighlightsShadows = (c: number, highlights: number, shadows: number): number => {
  const wHigh = Math.max(0, c - 0.5) * 2
  const wLow = Math.max(0, 0.5 - c) * 2
  return c + (highlights / 200) * wHigh + (shadows / 200) * wLow
}

const applyContrast = (c: number, contrast: number): number =>
  0.5 + (c - 0.5) * (1 + contrast / 100)

const applySaturation = (
  r: number,
  g: number,
  b: number,
  saturation: number,
  vibrance: number,
): readonly [number, number, number] => {
  const mean = (r + g + b) / 3
  const sat = saturation / 100
  const vib = vibrance / 100
  // Vibrance has the same shape as saturation in v1; the
  // skin-tone-protection refinement is deferred.
  const factor = 1 + sat + vib
  return [
    mean + (r - mean) * factor,
    mean + (g - mean) * factor,
    mean + (b - mean) * factor,
  ] as const
}

/**
 * Apply the slider stack in linear-light space and return the result as a
 * fresh `Float32Array` (RGBA interleaved). No clamping or sRGB encoding is
 * done here; that lives in `applyOnCpu`.
 *
 * Order of operations mirrors Lightroom's basic panel, end with curve / sat:
 *   1. White balance (temp/tint)
 *   2. Exposure (uniform scale)
 *   3. Whites / blacks (extreme-end push)
 *   4. Highlights / shadows (mid-range tone shaping)
 *   5. Contrast (linear S around 0.5)
 *   6. Tone curve
 *   7. Saturation / vibrance (chroma scale around per-pixel mean)
 */
export const applyLinear = (image: LinearImage, sliders: SliderStack): Float32Array => {
  const { data } = image
  const out = new Float32Array(data.length)
  const pixels = image.width * image.height

  const exposureGain = Math.pow(2, sliders.exposure)
  const tempFactor = 1 + sliders.temp / 200 // R *= temp; B /= temp
  const tintFactor = 1 - sliders.tint / 200 // G *= tintFactor (positive tint pulls G down)

  for (let i = 0; i < pixels; i++) {
    const idx = i * PIXEL_STRIDE

    // 1. White balance.
    let r = data[idx + 0] * tempFactor
    let g = data[idx + 1] * tintFactor
    let b = data[idx + 2] / tempFactor

    // 2. Exposure.
    r *= exposureGain
    g *= exposureGain
    b *= exposureGain

    // 3. Whites / blacks.
    r = applyWhitesBlacks(r, sliders.whites, sliders.blacks)
    g = applyWhitesBlacks(g, sliders.whites, sliders.blacks)
    b = applyWhitesBlacks(b, sliders.whites, sliders.blacks)

    // 4. Highlights / shadows.
    r = applyHighlightsShadows(r, sliders.highlights, sliders.shadows)
    g = applyHighlightsShadows(g, sliders.highlights, sliders.shadows)
    b = applyHighlightsShadows(b, sliders.highlights, sliders.shadows)

    // 5. Contrast.
    r = applyContrast(r, sliders.contrast)
    g = applyContrast(g, sliders.contrast)
    b = applyContrast(b, sliders.contrast)

    // 6. Tone curve.
    r = evalCurve(r, sliders.curvePoints)
    g = evalCurve(g, sliders.curvePoints)
    b = evalCurve(b, sliders.curvePoints)

    // 7. Saturation / vibrance.
    const sat = applySaturation(r, g, b, sliders.saturation, sliders.vibrance)
    out[idx + 0] = sat[0]
    out[idx + 1] = sat[1]
    out[idx + 2] = sat[2]
    out[idx + 3] = data[idx + 3]
  }

  return out
}

/**
 * Apply the slider stack and encode the result as a sRGB 8-bit RGBA buffer
 * suitable for `ImageData` / `OffscreenCanvas`. Out-of-range values clamp.
 */
export const applyOnCpu = (image: LinearImage, sliders: SliderStack): Uint8ClampedArray => {
  const linear = applyLinear(image, sliders)
  const out = new Uint8ClampedArray(linear.length)
  const pixels = image.width * image.height

  for (let i = 0; i < pixels; i++) {
    const idx = i * PIXEL_STRIDE
    out[idx + 0] = Math.round(encodeSrgb(linear[idx + 0]) * 255)
    out[idx + 1] = Math.round(encodeSrgb(linear[idx + 1]) * 255)
    out[idx + 2] = Math.round(encodeSrgb(linear[idx + 2]) * 255)
    out[idx + 3] = Math.round(clamp01(linear[idx + 3]) * 255)
  }

  return out
}
