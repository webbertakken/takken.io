/**
 * Stripped-down view of `OffscreenCanvas` that we actually depend on. The
 * full type lives in `lib.dom.d.ts` but isn't usable in the jsdom environment
 * where the tests run, so we lean on a minimal surface and inject the
 * factory in tests.
 */
interface CanvasLike {
  width: number
  height: number
  getContext(
    type: '2d',
  ): { putImageData(data: { data: Uint8ClampedArray }, x: number, y: number): void } | null
  convertToBlob(options: { type: string; quality?: number }): Promise<Blob>
}

type CanvasFactory = (width: number, height: number) => CanvasLike

export interface EncodeJpegOptions {
  /** 0..1 JPEG quality. Default 0.92 (Lightroom-style "high"). */
  quality?: number
  /** Injectable for tests; defaults to `new OffscreenCanvas(...)`. */
  canvasFactory?: CanvasFactory
}

/* v8 ignore start -- browser-only; covered by the canvasFactory injection in tests. */
const defaultCanvasFactory: CanvasFactory = (width, height) =>
  new OffscreenCanvas(width, height) as unknown as CanvasLike
/* v8 ignore stop */

/**
 * Encode a sRGB-encoded RGBA `Uint8ClampedArray` into a JPEG `Blob` via the
 * browser's `OffscreenCanvas` JPEG encoder. The bytes must match
 * `width * height * 4` exactly. Quality defaults to 0.92.
 */
export const encodeJpeg = async (
  width: number,
  height: number,
  bytes: Uint8ClampedArray,
  options: EncodeJpegOptions = {},
): Promise<Blob> => {
  const expected = width * height * 4
  if (bytes.length !== expected) {
    throw new Error(
      `encodeJpeg: buffer length ${bytes.length} does not match ${width}\u00d7${height}\u00d74 = ${expected}`,
    )
  }
  const factory = options.canvasFactory ?? defaultCanvasFactory
  const quality = options.quality ?? 0.92
  const canvas = factory(width, height)
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('encodeJpeg: 2D context unavailable')
  ctx.putImageData({ data: bytes }, 0, 0)
  return canvas.convertToBlob({ type: 'image/jpeg', quality })
}
