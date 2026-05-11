import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PIXEL_STRIDE } from '../domain/linear-image'
import { decodeRaw } from './decode-raw'

interface FakeRawOptions {
  width: number
  height: number
  pixels: Uint16Array
  metadata: Record<string, unknown>
  openShouldThrow?: boolean
}

let fakeOptions: FakeRawOptions

class FakeLibRaw {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async open(_buffer: Uint8Array, _settings?: unknown): Promise<void> {
    if (fakeOptions.openShouldThrow) {
      throw new Error('libraw: unsupported format')
    }
  }
  async metadata(): Promise<Record<string, unknown>> {
    return {
      width: fakeOptions.width,
      height: fakeOptions.height,
      ...fakeOptions.metadata,
    }
  }
  async imageData(): Promise<Uint16Array> {
    return fakeOptions.pixels
  }
}

vi.mock('libraw-wasm', () => ({ default: FakeLibRaw }))

const buildSolidPixels = (
  width: number,
  height: number,
  rgb16: readonly [number, number, number],
): Uint16Array => {
  const pixels = new Uint16Array(width * height * 3)
  for (let i = 0; i < width * height; i++) {
    pixels[i * 3 + 0] = rgb16[0]
    pixels[i * 3 + 1] = rgb16[1]
    pixels[i * 3 + 2] = rgb16[2]
  }
  return pixels
}

describe('decodeRaw', () => {
  beforeEach(() => {
    fakeOptions = {
      width: 4,
      height: 2,
      pixels: buildSolidPixels(4, 2, [32768, 16384, 8192]),
      metadata: { make: 'Canon', model: 'EOS R5' },
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a LinearImage with the reported dimensions', async () => {
    const decoded = await decodeRaw(new ArrayBuffer(0))

    expect(decoded.image.width).toBe(4)
    expect(decoded.image.height).toBe(2)
    expect(decoded.image.data.length).toBe(4 * 2 * PIXEL_STRIDE)
  })

  it('normalises 16-bit linear pixels into [0,1] floats', async () => {
    const decoded = await decodeRaw(new ArrayBuffer(0))

    expect(decoded.image.data[0]).toBeCloseTo(32768 / 65535, 5)
    expect(decoded.image.data[1]).toBeCloseTo(16384 / 65535, 5)
    expect(decoded.image.data[2]).toBeCloseTo(8192 / 65535, 5)
    expect(decoded.image.data[3]).toBe(1)
  })

  it('reads camera make and model from metadata', async () => {
    const decoded = await decodeRaw(new ArrayBuffer(0))

    expect(decoded.metadata.cameraMake).toBe('Canon')
    expect(decoded.metadata.cameraModel).toBe('EOS R5')
  })

  it('falls back to an empty string when metadata fields are missing', async () => {
    fakeOptions.metadata = {}
    const decoded = await decodeRaw(new ArrayBuffer(0))

    expect(decoded.metadata.cameraMake).toBe('')
    expect(decoded.metadata.cameraModel).toBe('')
  })

  it('throws a helpful error when libraw rejects the buffer', async () => {
    fakeOptions.openShouldThrow = true

    await expect(decodeRaw(new ArrayBuffer(0))).rejects.toThrow(/unsupported format/i)
  })

  it('throws when metadata reports a zero or missing dimension', async () => {
    fakeOptions.width = 0
    fakeOptions.pixels = new Uint16Array(0)

    await expect(decodeRaw(new ArrayBuffer(0))).rejects.toThrow(/dimensions/i)
  })

  it('throws when imageData length does not match the reported dimensions', async () => {
    fakeOptions.pixels = new Uint16Array(3 * 3 * 3) // 3x3 instead of 4x2
    await expect(decodeRaw(new ArrayBuffer(0))).rejects.toThrow(/pixel buffer/i)
  })

  it('preserves ISO and shutter speed when present in metadata', async () => {
    fakeOptions.metadata = {
      make: 'Sony',
      model: 'A7IV',
      iso_speed: 6400,
      shutter: 0.004,
      aperture: 2.8,
    }
    const decoded = await decodeRaw(new ArrayBuffer(0))

    expect(decoded.metadata.iso).toBe(6400)
    expect(decoded.metadata.shutter).toBe(0.004)
    expect(decoded.metadata.aperture).toBe(2.8)
  })
})
