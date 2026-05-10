import { createLinearImage, PIXEL_STRIDE, type LinearImage } from '../domain/linear-image'

export interface DecodedJpeg {
  readonly image: LinearImage
}

interface BytesPayload {
  readonly width: number
  readonly height: number
  readonly rgba: Uint8ClampedArray
}

export type BytesDecoder = (buffer: ArrayBuffer) => Promise<BytesPayload>

const SRGB_DECODE_THRESHOLD = 0.04045

/**
 * 8-bit sRGB byte -> linear-light value in [0,1]. Inverse of `encodeSrgb`.
 */
export const decodeSrgbByte = (byte: number): number => {
  const c = byte / 255
  if (c <= SRGB_DECODE_THRESHOLD) return c / 12.92
  return Math.pow((c + 0.055) / 1.055, 2.4)
}

const SRGB_LUT = (() => {
  const lut = new Float32Array(256)
  for (let i = 0; i < 256; i++) lut[i] = decodeSrgbByte(i)
  return lut
})()

const ALPHA_LUT = (() => {
  const lut = new Float32Array(256)
  for (let i = 0; i < 256; i++) lut[i] = i / 255
  return lut
})()

/**
 * Convert an interleaved sRGB-encoded RGBA byte buffer (e.g. from
 * `ImageData.data`) into a linear-light `LinearImage`. Alpha is decoded as
 * straight (non-premultiplied) [0,1].
 */
export const srgbBytesToLinear = (
  width: number,
  height: number,
  rgba: Uint8ClampedArray,
): LinearImage => {
  const expected = width * height * PIXEL_STRIDE
  if (rgba.length !== expected) {
    throw new Error(`sRGB byte length ${rgba.length} does not match ${width}\u00d7${height}\u00d74`)
  }
  const data = new Float32Array(expected)
  for (let i = 0; i < expected; i += PIXEL_STRIDE) {
    data[i + 0] = SRGB_LUT[rgba[i + 0]]
    data[i + 1] = SRGB_LUT[rgba[i + 1]]
    data[i + 2] = SRGB_LUT[rgba[i + 2]]
    data[i + 3] = ALPHA_LUT[rgba[i + 3]]
  }
  return createLinearImage(width, height, data)
}

/* v8 ignore start */
const decodeViaImageDecoder = async (buffer: ArrayBuffer): Promise<BytesPayload> => {
  // The browser-side path. Not exercised in jsdom; tested through Playwright
  // smoke runs in Phase 9.
  type ImageDecoderCtor = new (init: { type: string; data: ArrayBuffer }) => {
    decode(): Promise<{ image: { codedWidth: number; codedHeight: number } & VideoFrame }>
    close(): void
  }
  const Ctor = (globalThis as unknown as { ImageDecoder?: ImageDecoderCtor }).ImageDecoder
  if (!Ctor) throw new Error('ImageDecoder is not available in this environment')
  const decoder = new Ctor({ type: 'image/jpeg', data: buffer })
  const result = await decoder.decode()
  const { image } = result
  const canvas = new OffscreenCanvas(image.codedWidth, image.codedHeight)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable')
  ctx.drawImage(image, 0, 0)
  decoder.close()
  const data = ctx.getImageData(0, 0, image.codedWidth, image.codedHeight)
  return {
    width: image.codedWidth,
    height: image.codedHeight,
    rgba: data.data,
  }
}

const decodeViaCanvas = async (buffer: ArrayBuffer): Promise<BytesPayload> => {
  // Fallback for browsers without ImageDecoder. Same Phase 9 caveat.
  const blob = new Blob([buffer], { type: 'image/jpeg' })
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('JPEG decode failed via <img>'))
      img.src = url
    })
    const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable')
    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight)
    return { width: img.naturalWidth, height: img.naturalHeight, rgba: data.data }
  } finally {
    URL.revokeObjectURL(url)
  }
}

const browserBytesDecoder: BytesDecoder = async (buffer) => {
  const hasImageDecoder =
    typeof (globalThis as { ImageDecoder?: unknown }).ImageDecoder !== 'undefined'
  return hasImageDecoder ? decodeViaImageDecoder(buffer) : decodeViaCanvas(buffer)
}
/* v8 ignore stop */

export interface DecodeJpegOptions {
  /** Override the bytes decoder. Tests inject a fake; production uses the browser default. */
  bytesDecoder?: BytesDecoder
}

/**
 * Decode a JPEG (or anything `ImageDecoder` accepts) into a linear-light
 * `LinearImage`. The browser-side decoders are isolated behind an injectable
 * `bytesDecoder` so the conversion logic stays unit-testable in jsdom.
 */
export const decodeJpeg = async (
  buffer: ArrayBuffer,
  options: DecodeJpegOptions = {},
): Promise<DecodedJpeg> => {
  const decoder = options.bytesDecoder ?? browserBytesDecoder
  const { width, height, rgba } = await decoder(buffer)
  return { image: srgbBytesToLinear(width, height, rgba) }
}
