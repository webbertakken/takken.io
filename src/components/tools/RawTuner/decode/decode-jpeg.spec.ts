import { describe, expect, it } from 'vitest'
import { PIXEL_STRIDE } from '../domain/linear-image'
import { decodeJpeg, decodeSrgbByte, srgbBytesToLinear } from './decode-jpeg'

describe('decodeSrgbByte', () => {
  it('decodes 0 to 0', () => {
    expect(decodeSrgbByte(0)).toBe(0)
  })

  it('decodes 255 to 1', () => {
    expect(decodeSrgbByte(255)).toBeCloseTo(1, 5)
  })

  it('uses the linear segment below the sRGB threshold', () => {
    expect(decodeSrgbByte(5)).toBeCloseTo(5 / 255 / 12.92, 5)
  })

  it('decodes mid-grey 119 (~0.461 sRGB) to ~0.18 linear', () => {
    expect(decodeSrgbByte(119)).toBeCloseTo(0.18, 2)
  })

  it('round-trips with encodeSrgb (sRGB byte -> linear -> sRGB byte)', async () => {
    const { encodeSrgb } = await import('../applier/cpu-fallback')
    for (const byte of [0, 1, 8, 64, 119, 200, 255]) {
      const linear = decodeSrgbByte(byte)
      const back = Math.round(encodeSrgb(linear) * 255)
      expect(back).toBe(byte)
    }
  })
})

describe('srgbBytesToLinear', () => {
  it('builds a LinearImage with the right dimensions', () => {
    const rgba = new Uint8ClampedArray(2 * 2 * PIXEL_STRIDE)
    const image = srgbBytesToLinear(2, 2, rgba)

    expect(image.width).toBe(2)
    expect(image.height).toBe(2)
    expect(image.data.length).toBe(2 * 2 * PIXEL_STRIDE)
  })

  it('decodes sRGB bytes to linear-light floats', () => {
    const rgba = new Uint8ClampedArray([255, 119, 0, 200, 0, 0, 0, 255])
    const image = srgbBytesToLinear(2, 1, rgba)

    expect(image.data[0]).toBeCloseTo(1, 4)
    expect(image.data[1]).toBeCloseTo(0.18, 2)
    expect(image.data[2]).toBe(0)
    expect(image.data[3]).toBeCloseTo(200 / 255, 4)
    expect(image.data[4]).toBe(0)
    expect(image.data[5]).toBe(0)
    expect(image.data[6]).toBe(0)
    expect(image.data[7]).toBe(1)
  })

  it('throws when the buffer length does not match dimensions', () => {
    expect(() => srgbBytesToLinear(2, 2, new Uint8ClampedArray(8))).toThrow(/length/i)
  })
})

describe('decodeJpeg (with injected bytes decoder)', () => {
  it('hands a successful decode through the sRGB->linear pipeline', async () => {
    const fakeDecoder = async () => ({
      width: 1,
      height: 1,
      rgba: new Uint8ClampedArray([255, 119, 0, 255]),
    })
    const decoded = await decodeJpeg(new ArrayBuffer(0), { bytesDecoder: fakeDecoder })

    expect(decoded.image.width).toBe(1)
    expect(decoded.image.height).toBe(1)
    expect(decoded.image.data[0]).toBeCloseTo(1, 4)
    expect(decoded.image.data[1]).toBeCloseTo(0.18, 2)
    expect(decoded.image.data[3]).toBe(1)
  })

  it('propagates failures from the bytes decoder with a useful message', async () => {
    const fakeDecoder = async () => {
      throw new Error('decode failed: unsupported variant')
    }

    await expect(decodeJpeg(new ArrayBuffer(0), { bytesDecoder: fakeDecoder })).rejects.toThrow(
      /unsupported variant/,
    )
  })
})
