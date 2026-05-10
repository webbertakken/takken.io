import { createLinearImage, PIXEL_STRIDE, type LinearImage } from './linear-image'

/**
 * Downsample a `LinearImage` so its longer side is at most `maxSide`, using
 * box-filter averaging in linear-light space. Returns the input unchanged if
 * it already fits.
 *
 * Box-filter is the right choice for editing previews: it preserves
 * histogram statistics (mean / variance), so the heuristics you compute from
 * the downsampled preview match the full-res image.
 */
export const downsample = (image: LinearImage, maxSide: number): LinearImage => {
  const longest = Math.max(image.width, image.height)
  if (longest <= maxSide) return image

  const scale = maxSide / longest
  const targetW = Math.max(1, Math.round(image.width * scale))
  const targetH = Math.max(1, Math.round(image.height * scale))
  const out = createLinearImage(targetW, targetH)
  const sx = image.width / targetW
  const sy = image.height / targetH

  for (let y = 0; y < targetH; y++) {
    const srcY0 = Math.floor(y * sy)
    const srcY1 = Math.min(image.height, Math.max(srcY0 + 1, Math.floor((y + 1) * sy)))
    for (let x = 0; x < targetW; x++) {
      const srcX0 = Math.floor(x * sx)
      const srcX1 = Math.min(image.width, Math.max(srcX0 + 1, Math.floor((x + 1) * sx)))

      let r = 0
      let g = 0
      let b = 0
      let a = 0
      let count = 0
      for (let yy = srcY0; yy < srcY1; yy++) {
        for (let xx = srcX0; xx < srcX1; xx++) {
          const idx = (yy * image.width + xx) * PIXEL_STRIDE
          r += image.data[idx + 0]
          g += image.data[idx + 1]
          b += image.data[idx + 2]
          a += image.data[idx + 3]
          count++
        }
      }
      const dst = (y * targetW + x) * PIXEL_STRIDE
      out.data[dst + 0] = r / count
      out.data[dst + 1] = g / count
      out.data[dst + 2] = b / count
      out.data[dst + 3] = a / count
    }
  }
  return out
}
