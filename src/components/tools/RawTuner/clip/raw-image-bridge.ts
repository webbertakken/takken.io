import { encodeSrgb } from '../applier/cpu-fallback'
import { PIXEL_STRIDE, type LinearImage } from '../domain/linear-image'

export interface SrgbRgbImage {
  readonly width: number
  readonly height: number
  /** Interleaved sRGB-encoded 8-bit RGB. Length = width * height * 3. */
  readonly data: Uint8ClampedArray
}

/**
 * Convert a linear-light `LinearImage` into 3-channel sRGB-encoded bytes,
 * the format CLIP's image preprocessor expects. Alpha is dropped.
 *
 * Used to feed our `LinearImage` into `transformers.js`'s `RawImage`
 * constructor, which takes `(Uint8ClampedArray, width, height, channels)`.
 */
export const linearToSrgbRgb = (image: LinearImage): SrgbRgbImage => {
  const pixels = image.width * image.height
  const out = new Uint8ClampedArray(pixels * 3)
  for (let i = 0; i < pixels; i++) {
    const src = i * PIXEL_STRIDE
    const dst = i * 3
    out[dst + 0] = Math.round(encodeSrgb(image.data[src + 0]) * 255)
    out[dst + 1] = Math.round(encodeSrgb(image.data[src + 1]) * 255)
    out[dst + 2] = Math.round(encodeSrgb(image.data[src + 2]) * 255)
  }
  return { width: image.width, height: image.height, data: out }
}
