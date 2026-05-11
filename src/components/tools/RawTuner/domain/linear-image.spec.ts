import { describe, expect, it } from 'vitest'
import { createLinearImage, PIXEL_STRIDE } from './linear-image'

describe('createLinearImage', () => {
  it('allocates a zeroed RGBA buffer when no data is provided', () => {
    const image = createLinearImage(3, 2)

    expect(image.width).toBe(3)
    expect(image.height).toBe(2)
    expect(image.data).toBeInstanceOf(Float32Array)
    expect(image.data.length).toBe(3 * 2 * PIXEL_STRIDE)
    expect([...image.data]).toEqual(new Array(24).fill(0))
  })

  it('wraps a provided buffer that matches the dimensions', () => {
    const buffer = new Float32Array(2 * 1 * PIXEL_STRIDE)
    buffer.set([1, 0, 0, 1, 0, 1, 0, 1])
    const image = createLinearImage(2, 1, buffer)

    expect(image.data).toBe(buffer)
  })

  it('rejects non-positive integer dimensions', () => {
    expect(() => createLinearImage(0, 1)).toThrow(RangeError)
    expect(() => createLinearImage(-1, 1)).toThrow(RangeError)
    expect(() => createLinearImage(1.5, 1)).toThrow(RangeError)
    expect(() => createLinearImage(1, 0)).toThrow(RangeError)
    expect(() => createLinearImage(1, -1)).toThrow(RangeError)
    expect(() => createLinearImage(1, 1.5)).toThrow(RangeError)
  })

  it('rejects buffers whose length does not match dimensions', () => {
    expect(() => createLinearImage(2, 2, new Float32Array(8))).toThrow(RangeError)
  })
})
