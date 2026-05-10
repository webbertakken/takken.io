import { createLinearImage, PIXEL_STRIDE, type LinearImage } from '../domain/linear-image'

/**
 * Cleaned-up subset of the libraw metadata we actually want downstream. Add
 * fields here as they prove useful in the UI; everything else stays
 * accessible via `raw.rawMetadata` for future-proofing.
 */
export interface DecodedRawMetadata {
  readonly cameraMake: string
  readonly cameraModel: string
  readonly iso: number | null
  readonly shutter: number | null
  readonly aperture: number | null
  readonly raw: Readonly<Record<string, unknown>>
}

export interface DecodedRaw {
  readonly image: LinearImage
  readonly metadata: DecodedRawMetadata
}

const NORM_16BIT = 1 / 65535

const readNumber = (record: Readonly<Record<string, unknown>>, key: string): number | null => {
  const value = record[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

const readString = (record: Readonly<Record<string, unknown>>, key: string): string => {
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

const buildLinearImage = (width: number, height: number, pixels: Uint16Array): LinearImage => {
  const expected = width * height * 3
  if (pixels.length !== expected) {
    throw new Error(
      `RAW pixel buffer length ${pixels.length} does not match ${width}\u00d7${height}\u00d73 = ${expected}`,
    )
  }

  const data = new Float32Array(width * height * PIXEL_STRIDE)
  for (let i = 0; i < width * height; i++) {
    const src = i * 3
    const dst = i * PIXEL_STRIDE
    data[dst + 0] = pixels[src + 0] * NORM_16BIT
    data[dst + 1] = pixels[src + 1] * NORM_16BIT
    data[dst + 2] = pixels[src + 2] * NORM_16BIT
    data[dst + 3] = 1
  }
  return createLinearImage(width, height, data)
}

/**
 * Decode a RAW file into a linear-light `LinearImage` (Float32 RGBA in [0,1])
 * plus a normalised metadata record. libraw-wasm is loaded lazily so the
 * dependency only enters the bundle when the tool is actually used.
 *
 * Settings:
 *   - outputColor 1 (sRGB primaries)
 *   - outputBps 16 (16-bit per channel intermediate)
 *   - gamm [1, 1] (no display gamma; we want linear-light data)
 *   - useCameraWb true (start from the camera's recorded white balance)
 */
export const decodeRaw = async (buffer: ArrayBuffer): Promise<DecodedRaw> => {
  const { default: LibRaw } = await import('libraw-wasm')
  const raw = new LibRaw()
  await raw.open(new Uint8Array(buffer), {
    outputColor: 1,
    outputBps: 16,
    gamm: [1, 1],
    useCameraWb: true,
  })

  const meta = (await raw.metadata()) as Readonly<Record<string, unknown>>
  const width = readNumber(meta, 'width')
  const height = readNumber(meta, 'height')
  if (!width || !height) {
    throw new Error(`RAW reported invalid dimensions: ${width}\u00d7${height}`)
  }

  const pixels = (await raw.imageData()) as Uint16Array

  return {
    image: buildLinearImage(width, height, pixels),
    metadata: {
      cameraMake: readString(meta, 'make'),
      cameraModel: readString(meta, 'model'),
      iso: readNumber(meta, 'iso_speed'),
      shutter: readNumber(meta, 'shutter'),
      aperture: readNumber(meta, 'aperture'),
      raw: meta,
    },
  }
}
