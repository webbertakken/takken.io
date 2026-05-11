import { clipFractions, histogram, percentile } from '../domain/histogram'
import { PIXEL_STRIDE, type LinearImage } from '../domain/linear-image'

/**
 * Pure measurements the auto-tuner reads to choose slider values. No
 * decisions are made here — the values are raw observations.
 *
 *   - blackPoint / whitePoint: linear values at the lower / upper percentile
 *     (default 0.25% / 99.75%). Used to stretch the tone range.
 *   - midGrey: median luma. Drives the exposure correction towards 0.18.
 *   - wbTemp / wbTint: normalised colour-cast measurements in [-1, 1].
 *     Positive wbTemp = scene biased warm. Positive wbTint = scene biased green.
 *   - clippedHighlightsPct / clippedShadowsPct: fraction of pixels already
 *     clipping at the sensor or in the linear buffer.
 */
export interface ImageAnalysis {
  readonly blackPoint: number
  readonly whitePoint: number
  readonly midGrey: number
  readonly wbTemp: number
  readonly wbTint: number
  readonly clippedHighlightsPct: number
  readonly clippedShadowsPct: number
}

export interface AnalysisOptions {
  readonly blackPercentile: number
  readonly whitePercentile: number
}

const DEFAULT_OPTIONS: AnalysisOptions = {
  blackPercentile: 0.0025,
  whitePercentile: 0.9975,
}

const meanChannels = (image: LinearImage): readonly [number, number, number] => {
  const { data } = image
  const pixels = image.width * image.height
  let r = 0
  let g = 0
  let b = 0
  for (let i = 0; i < pixels; i++) {
    const idx = i * PIXEL_STRIDE
    r += data[idx]
    g += data[idx + 1]
    b += data[idx + 2]
  }
  return [r / pixels, g / pixels, b / pixels] as const
}

/**
 * Normalised warm/cool offset. Positive means R > B in the average, i.e. the
 * scene is biased warm and a cooling correction is appropriate.
 */
const wbTemp = (r: number, b: number): number => {
  const sum = r + b
  return sum === 0 ? 0 : (r - b) / sum
}

/**
 * Normalised green/magenta offset. Positive means G dominates over (R+B)/2.
 */
const wbTint = (r: number, g: number, b: number): number => {
  const rb = (r + b) / 2
  const sum = g + rb
  return sum === 0 ? 0 : (g - rb) / sum
}

export const analyseImage = (
  image: LinearImage,
  options: AnalysisOptions = DEFAULT_OPTIONS,
): ImageAnalysis => {
  const { blackPercentile, whitePercentile } = options
  const lumaHist = histogram(image, 'luma')

  const blackPoint = percentile(lumaHist, blackPercentile)
  const whitePoint = percentile(lumaHist, whitePercentile)
  const midGrey = percentile(lumaHist, 0.5)

  const [meanR, meanG, meanB] = meanChannels(image)
  const { low, high } = clipFractions(image)

  return {
    blackPoint,
    whitePoint,
    midGrey,
    wbTemp: wbTemp(meanR, meanB),
    wbTint: wbTint(meanR, meanG, meanB),
    clippedHighlightsPct: high,
    clippedShadowsPct: low,
  }
}
