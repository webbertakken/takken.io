import { defaultSliderStack, mergeSliderStacks, type SliderStack } from '../domain/slider-stack'
import type { ImageAnalysis } from './analyse'

const TARGET_MID_GREY = 0.18
const MAX_EXPOSURE_EV = 3
const MIN_EXPOSURE_EV = -3

const WB_TEMP_SCALE = 200
const WB_TINT_SCALE = 200

const WHITES_SCALE = 100
const BLACKS_SCALE = 100

/**
 * Highlight-clipping fraction at which we stop trying to raise exposure
 * further. Beyond this we actively walk back, since lifting exposure on a
 * heavily-clipped image just spreads the clipped region.
 */
const HIGHLIGHT_CLIP_BACKOFF_THRESHOLD = 0.05

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Convert measured analysis into a `SliderStack` baseline. Rules:
 *
 *   - exposure pushes midGrey toward 0.18 in EV space, clamped to ±3 EV.
 *   - clipped highlights pull exposure back proportionally, so an
 *     already-blown image isn't pushed further.
 *   - whites lifts a low whitePoint toward 1.0; blacks crushes a raised
 *     blackPoint back to 0; both clamped to ±100.
 *   - temp/tint compensate the measured grey-world cast, sign-inverted
 *     because positive cast wants negative slider.
 */
export const autoTune = (analysis: ImageAnalysis): SliderStack => {
  const safeMidGrey = Math.max(analysis.midGrey, 1e-4)
  const desiredExposure = Math.log2(TARGET_MID_GREY / safeMidGrey)

  const highlightBackoff =
    analysis.clippedHighlightsPct > HIGHLIGHT_CLIP_BACKOFF_THRESHOLD
      ? -2 * (analysis.clippedHighlightsPct - HIGHLIGHT_CLIP_BACKOFF_THRESHOLD)
      : 0

  const exposure = clamp(desiredExposure + highlightBackoff, MIN_EXPOSURE_EV, MAX_EXPOSURE_EV)

  const whites = clamp((1 - analysis.whitePoint) * WHITES_SCALE, -100, 100)
  const blacks = clamp(-analysis.blackPoint * BLACKS_SCALE, -100, 100)

  const temp = clamp(-analysis.wbTemp * WB_TEMP_SCALE, -100, 100)
  const tint = clamp(-analysis.wbTint * WB_TINT_SCALE, -100, 100)

  return mergeSliderStacks(defaultSliderStack(), {
    exposure,
    whites,
    blacks,
    temp,
    tint,
  })
}
