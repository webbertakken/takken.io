import { PIXEL_STRIDE, type LinearImage } from './linear-image'

export const HISTOGRAM_BUCKETS = 256

export type Channel = 'r' | 'g' | 'b' | 'luma'

const CHANNEL_OFFSET: Record<Exclude<Channel, 'luma'>, number> = { r: 0, g: 1, b: 2 }

// Rec.709 luma coefficients in linear-light space.
const LUMA_R = 0.2126
const LUMA_G = 0.7152
const LUMA_B = 0.0722

const luma = (r: number, g: number, b: number) => LUMA_R * r + LUMA_G * g + LUMA_B * b

const valueToBucket = (value: number) => {
  if (value <= 0) return 0
  if (value >= 1) return HISTOGRAM_BUCKETS - 1
  return Math.min(HISTOGRAM_BUCKETS - 1, Math.floor(value * HISTOGRAM_BUCKETS))
}

/**
 * Build a 256-bucket histogram of the requested channel. Values <= 0 map to
 * bucket 0, values >= 1 map to the top bucket, the rest are linearly binned.
 *
 * Returned array sums to `image.width * image.height`.
 */
export const histogram = (image: LinearImage, channel: Channel): Uint32Array => {
  const out = new Uint32Array(HISTOGRAM_BUCKETS)
  const { data } = image
  const pixels = image.width * image.height

  if (channel === 'luma') {
    for (let i = 0; i < pixels; i++) {
      const idx = i * PIXEL_STRIDE
      out[valueToBucket(luma(data[idx], data[idx + 1], data[idx + 2]))]++
    }
  } else {
    const offset = CHANNEL_OFFSET[channel]
    for (let i = 0; i < pixels; i++) {
      out[valueToBucket(data[i * PIXEL_STRIDE + offset])]++
    }
  }

  return out
}

/**
 * Linearly-interpolated percentile in [0,1] from a histogram. Throws on an
 * empty histogram or out-of-range `p`. p=0 returns the lowest occupied bucket,
 * p=1 the highest.
 */
export const percentile = (hist: Uint32Array, p: number): number => {
  if (p < 0 || p > 1) {
    throw new RangeError(`p must be in [0,1], got ${p}`)
  }
  let total = 0
  for (let i = 0; i < hist.length; i++) total += hist[i]
  if (total === 0) {
    throw new Error('Cannot compute percentile of an empty histogram')
  }

  const target = p * total
  let cumulative = 0
  for (let i = 0; i < hist.length; i++) {
    const next = cumulative + hist[i]
    if (next >= target) {
      const localFraction = hist[i] === 0 ? 0 : (target - cumulative) / hist[i]
      return Math.min(1, (i + localFraction) / hist.length)
    }
    cumulative = next
  }
  // Unreachable: target <= total, so the loop always returns before exit.
  /* v8 ignore next */
  throw new Error('percentile: target unreachable; this should never happen')
}

interface ClipThresholds {
  /** Pixels with any channel >= this fraction count as highlight-clipped. */
  highThreshold: number
  /** Pixels with any channel <= this fraction count as shadow-clipped. */
  lowThreshold: number
}

const DEFAULT_THRESHOLDS: ClipThresholds = { highThreshold: 0.995, lowThreshold: 0.005 }

/**
 * Fraction of pixels that clip in the highlights or shadows. A pixel is
 * counted once at most per side, even if multiple channels clip. Defaults
 * mirror the bounds Lightroom's clip-warning indicators use (0.5%).
 */
export const clipFractions = (
  image: LinearImage,
  thresholds: ClipThresholds = DEFAULT_THRESHOLDS,
): { low: number; high: number } => {
  const { highThreshold, lowThreshold } = thresholds
  const { data } = image
  const pixels = image.width * image.height
  let low = 0
  let high = 0

  for (let i = 0; i < pixels; i++) {
    const idx = i * PIXEL_STRIDE
    const r = data[idx]
    const g = data[idx + 1]
    const b = data[idx + 2]
    if (r >= highThreshold || g >= highThreshold || b >= highThreshold) high++
    if (r <= lowThreshold && g <= lowThreshold && b <= lowThreshold) low++
  }

  return { low: low / pixels, high: high / pixels }
}

/** Rec.709 mean luma over a linear image, clamped at zero. */
export const meanLuma = (image: LinearImage): number => {
  const { data } = image
  const pixels = image.width * image.height
  let sum = 0
  for (let i = 0; i < pixels; i++) {
    const idx = i * PIXEL_STRIDE
    sum += luma(data[idx], data[idx + 1], data[idx + 2])
  }
  return Math.max(0, sum / pixels)
}
