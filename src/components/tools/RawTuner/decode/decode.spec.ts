import { describe, expect, it, vi } from 'vitest'

vi.mock('./decode-raw', () => ({
  decodeRaw: vi.fn(async () => ({
    image: { width: 4, height: 2, data: new Float32Array(4 * 2 * 4) },
    metadata: {
      cameraMake: 'Canon',
      cameraModel: 'EOS R5',
      iso: 100,
      shutter: 0.01,
      aperture: 2.8,
      raw: {},
    },
  })),
}))

vi.mock('./decode-jpeg', () => ({
  decodeJpeg: vi.fn(async () => ({
    image: { width: 8, height: 4, data: new Float32Array(8 * 4 * 4) },
  })),
}))

import { decode, sniffFormat } from './decode'
import { decodeJpeg } from './decode-jpeg'
import { decodeRaw } from './decode-raw'

const buildBuffer = (bytes: readonly number[], length = bytes.length): ArrayBuffer => {
  const u8 = new Uint8Array(length)
  u8.set(bytes)
  return u8.buffer
}

const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0]
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const TIFF_LE_HEADER = [0x49, 0x49, 0x2a, 0x00]
const TIFF_BE_HEADER = [0x4d, 0x4d, 0x00, 0x2a]
const CR3_HEADER = [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]

describe('sniffFormat', () => {
  it.each([
    ['photo.jpg', JPEG_HEADER, 'jpeg'],
    ['photo.JPEG', JPEG_HEADER, 'jpeg'],
    ['photo.png', PNG_HEADER, 'jpeg'],
    ['photo.cr2', TIFF_LE_HEADER, 'raw'],
    ['photo.nef', TIFF_LE_HEADER, 'raw'],
    ['photo.arw', TIFF_LE_HEADER, 'raw'],
    ['photo.dng', TIFF_LE_HEADER, 'raw'],
    ['photo.raf', TIFF_LE_HEADER, 'raw'],
    ['photo.cr3', CR3_HEADER, 'raw'],
  ] as const)('detects %s as %s by extension', (name, header, expected) => {
    expect(sniffFormat(name, buildBuffer([...header]))).toBe(expected)
  })

  it('falls back to magic bytes when the extension is unknown - JPEG', () => {
    expect(sniffFormat('mystery.bin', buildBuffer(JPEG_HEADER))).toBe('jpeg')
  })

  it('falls back to magic bytes when the extension is unknown - PNG', () => {
    expect(sniffFormat('mystery.bin', buildBuffer(PNG_HEADER))).toBe('jpeg')
  })

  it('falls back to magic bytes when the extension is unknown - WebP RIFF', () => {
    const webpHeader = [
      0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38,
      0x20,
    ]
    expect(sniffFormat('mystery.bin', buildBuffer(webpHeader))).toBe('jpeg')
  })

  it('falls back to magic bytes when the extension is unknown - TIFF little-endian', () => {
    expect(sniffFormat('mystery.bin', buildBuffer(TIFF_LE_HEADER))).toBe('raw')
  })

  it('falls back to magic bytes when the extension is unknown - TIFF big-endian', () => {
    expect(sniffFormat('mystery.bin', buildBuffer(TIFF_BE_HEADER))).toBe('raw')
  })

  it('falls back to magic bytes when the extension is unknown - CR3 ftyp box', () => {
    expect(sniffFormat('mystery.bin', buildBuffer(CR3_HEADER))).toBe('raw')
  })

  it('returns "unknown" when neither extension nor magic bytes match', () => {
    expect(
      sniffFormat('mystery', buildBuffer([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07])),
    ).toBe('unknown')
  })
})

describe('decode', () => {
  it('routes JPEG files to decodeJpeg', async () => {
    vi.mocked(decodeJpeg).mockClear()
    const result = await decode({ name: 'sun.jpg', buffer: buildBuffer(JPEG_HEADER) })

    expect(decodeJpeg).toHaveBeenCalledTimes(1)
    expect(result.image.width).toBe(8)
    expect(result.metadata.cameraMake).toBe('')
  })

  it('routes RAW files to decodeRaw and surfaces the metadata', async () => {
    vi.mocked(decodeRaw).mockClear()
    const result = await decode({ name: 'sun.cr2', buffer: buildBuffer(TIFF_LE_HEADER) })

    expect(decodeRaw).toHaveBeenCalledTimes(1)
    expect(result.image.width).toBe(4)
    expect(result.metadata.cameraMake).toBe('Canon')
  })

  it('throws a typed error on unknown formats with the file name in the message', async () => {
    await expect(
      decode({ name: 'mystery.bin', buffer: buildBuffer([0, 1, 2, 3, 4, 5, 6, 7]) }),
    ).rejects.toThrow(/mystery\.bin/)
  })
})
