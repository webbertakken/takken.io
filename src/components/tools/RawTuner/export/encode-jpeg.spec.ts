import { describe, expect, it, vi } from 'vitest'
import { encodeJpeg } from './encode-jpeg'

describe('encodeJpeg (with injected canvas factory)', () => {
  it('builds an OffscreenCanvas of the requested dimensions and writes the bytes', async () => {
    const putImageData = vi.fn()
    const ctx = { putImageData }
    const convertToBlob = vi.fn(async () => new Blob(['fake-jpeg'], { type: 'image/jpeg' }))
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      convertToBlob,
    }
    const factory = vi.fn(() => canvas)

    const bytes = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255])

    const blob = await encodeJpeg(2, 1, bytes, { canvasFactory: factory })

    expect(factory).toHaveBeenCalledWith(2, 1)
    expect(canvas.getContext).toHaveBeenCalledWith('2d')
    expect(putImageData).toHaveBeenCalledTimes(1)
    expect(convertToBlob).toHaveBeenCalledWith({ type: 'image/jpeg', quality: 0.92 })
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/jpeg')
  })

  it('respects a custom quality option', async () => {
    const convertToBlob = vi.fn(async () => new Blob(['x']))
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ putImageData: () => undefined }),
      convertToBlob,
    }

    await encodeJpeg(1, 1, new Uint8ClampedArray(4), {
      canvasFactory: () => canvas,
      quality: 0.6,
    })

    expect(convertToBlob).toHaveBeenCalledWith({ type: 'image/jpeg', quality: 0.6 })
  })

  it('rejects when the 2D context is unavailable', async () => {
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => null,
      convertToBlob: vi.fn(),
    }

    await expect(
      encodeJpeg(1, 1, new Uint8ClampedArray(4), { canvasFactory: () => canvas }),
    ).rejects.toThrow(/2D context/)
  })

  it('throws when the byte buffer length does not match dimensions', async () => {
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ putImageData: () => undefined }),
      convertToBlob: async () => new Blob(['x']),
    }

    await expect(
      encodeJpeg(2, 2, new Uint8ClampedArray(8), { canvasFactory: () => canvas }),
    ).rejects.toThrow(/buffer length/i)
  })
})
