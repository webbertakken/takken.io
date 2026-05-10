import type { LinearImage } from '../domain/linear-image'
import { decodeJpeg } from './decode-jpeg'
import { decodeRaw, type DecodedRawMetadata } from './decode-raw'

export type DecodedFormat = 'raw' | 'jpeg' | 'unknown'

export interface DecodedImageMetadata {
  readonly cameraMake: string
  readonly cameraModel: string
  readonly iso: number | null
  readonly shutter: number | null
  readonly aperture: number | null
  readonly raw: Readonly<Record<string, unknown>>
}

export interface DecodedImage {
  readonly image: LinearImage
  readonly metadata: DecodedImageMetadata
}

export interface DecodeInput {
  readonly name: string
  readonly buffer: ArrayBuffer
}

const RAW_EXTENSIONS = new Set([
  // The "big five" plus the long tail libraw supports out of the box. We
  // advertise the big five in the UI but accept anything libraw can read.
  'cr2',
  'cr3',
  'crw',
  'nef',
  'nrw',
  'arw',
  'sr2',
  'srf',
  'dng',
  'raf',
  'rw2',
  'orf',
  'pef',
  'rwl',
  '3fr',
  'fff',
  'iiq',
  'mef',
  'mos',
  'mrw',
  'kdc',
  'dcr',
  'erf',
  'srw',
  'x3f',
])

const JPEG_EXTENSIONS = new Set(['jpg', 'jpeg', 'jfif', 'png', 'webp'])

const startsWith = (buffer: ArrayBuffer, signature: readonly number[], offset = 0): boolean => {
  if (buffer.byteLength < offset + signature.length) return false
  const view = new Uint8Array(buffer, offset, signature.length)
  for (let i = 0; i < signature.length; i++) {
    if (view[i] !== signature[i]) return false
  }
  return true
}

const sniffByMagic = (buffer: ArrayBuffer): DecodedFormat => {
  // JPEG, PNG, WebP -> handled by the browser image pipeline.
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'jpeg'
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'jpeg'
  if (
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  )
    return 'jpeg'

  // TIFF / DNG / CR2 / NEF / ARW / RAF use a TIFF-style header.
  if (startsWith(buffer, [0x49, 0x49, 0x2a, 0x00])) return 'raw'
  if (startsWith(buffer, [0x4d, 0x4d, 0x00, 0x2a])) return 'raw'

  // CR3 / HEIF use the ISOBMFF "ftyp" box at offset 4.
  if (startsWith(buffer, [0x66, 0x74, 0x79, 0x70], 4)) return 'raw'

  return 'unknown'
}

const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''
}

/**
 * Decide which pipeline to use based on extension first, then magic bytes.
 * Extension wins because RAW files all share the TIFF header, but a Sony
 * `.arw` and a Photoshop-saved TIFF want different pipelines.
 */
export const sniffFormat = (name: string, buffer: ArrayBuffer): DecodedFormat => {
  const ext = extensionOf(name)
  if (RAW_EXTENSIONS.has(ext)) return 'raw'
  if (JPEG_EXTENSIONS.has(ext)) return 'jpeg'
  return sniffByMagic(buffer)
}

const EMPTY_METADATA: DecodedImageMetadata = {
  cameraMake: '',
  cameraModel: '',
  iso: null,
  shutter: null,
  aperture: null,
  raw: {},
}

const liftRawMetadata = (metadata: DecodedRawMetadata): DecodedImageMetadata => metadata

export const decode = async (input: DecodeInput): Promise<DecodedImage> => {
  const format = sniffFormat(input.name, input.buffer)
  if (format === 'raw') {
    const decoded = await decodeRaw(input.buffer)
    return { image: decoded.image, metadata: liftRawMetadata(decoded.metadata) }
  }
  if (format === 'jpeg') {
    const decoded = await decodeJpeg(input.buffer)
    return { image: decoded.image, metadata: EMPTY_METADATA }
  }
  throw new Error(`Cannot decode ${input.name}: unknown format`)
}
