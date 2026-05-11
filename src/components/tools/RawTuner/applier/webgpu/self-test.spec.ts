import { describe, expect, it } from 'vitest'
import { FakeDevice } from './fake-device'
import { webgpuSelfTest, SELF_TEST_TOLERANCE } from './self-test'

/**
 * The self-test seeds the fake device's staging buffer with the bytes the
 * shader would have produced (we control them in tests). The simplest path
 * to "GPU produced exactly what CPU produced" is to run the wrapper twice:
 * once to learn the expected u8 output, then again with the fake seeded.
 *
 * We can short-circuit that by exposing a fixture: the CPU baseline for the
 * self-test sliders is deterministic, so we capture it once and tweak it.
 */
const buildBaselineFakeDevice = async (): Promise<FakeDevice> => {
  // First pass: a fake with all-zero readback. We don't care about the
  // returned bytes, only that we can grab the CPU baseline from a real call.
  const probe = new FakeDevice({ stagingBytes: new Float32Array(4 * 4 * 4) })
  await webgpuSelfTest(probe as unknown as GPUDevice)
  // The CPU baseline is independent of the device, so the easiest move is to
  // re-create one and let the test seed `stagingBytes` per scenario.
  return new FakeDevice()
}

const u8ToFloatSrgb = (bytes: Uint8ClampedArray): Float32Array => {
  const out = new Float32Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] / 255
  return out
}

describe('webgpuSelfTest', () => {
  it('returns true when the GPU output matches the CPU baseline byte-for-byte', async () => {
    const { applyOnCpu } = await import('../cpu-fallback')
    const { createLinearImage, PIXEL_STRIDE } = await import('../../domain/linear-image')
    const { defaultSliderStack, mergeSliderStacks } = await import('../../domain/slider-stack')

    // Reconstruct the same fixture the self-test uses.
    const image = createLinearImage(4, 4)
    const samples = [
      [0.02, 0.02, 0.02],
      [0.18, 0.18, 0.18],
      [0.62, 0.41, 0.21],
      [0.95, 0.92, 0.88],
      [0.05, 0.18, 0.42],
      [0.7, 0.5, 0.3],
      [0.18, 0.5, 0.18],
      [0.5, 0.18, 0.5],
      [0.0, 0.0, 0.0],
      [1.0, 1.0, 1.0],
      [0.3, 0.3, 0.3],
      [0.8, 0.8, 0.8],
      [0.5, 0.55, 0.6],
      [0.55, 0.5, 0.45],
      [0.25, 0.4, 0.6],
      [0.6, 0.4, 0.25],
    ]
    samples.forEach(([r, g, b], i) => {
      image.data.set([r, g, b, 1], i * PIXEL_STRIDE)
    })
    const sliders = mergeSliderStacks(defaultSliderStack(), {
      exposure: 0.5,
      contrast: 25,
      highlights: -30,
      shadows: 20,
      whites: 15,
      blacks: -25,
      temp: -10,
      tint: 5,
      vibrance: 0,
      saturation: 10,
      curvePoints: [
        { x: 0, y: 0.02 },
        { x: 0.5, y: 0.55 },
        { x: 1, y: 0.97 },
      ],
    })
    const cpuExpected = applyOnCpu(image, sliders)

    const device = new FakeDevice({ stagingBytes: u8ToFloatSrgb(cpuExpected) })

    expect(await webgpuSelfTest(device as unknown as GPUDevice)).toBe(true)
  })

  it('returns true when the GPU output is within the per-channel tolerance', async () => {
    const baseline = await buildBaselineFakeDevice()
    void baseline
    // Scenario: synthesise a fake whose readback is "all zeros + tolerance" and
    // pass it through. Since the CPU baseline is non-zero, this fails the
    // tolerance test — so for a within-tolerance test, we need the actual
    // baseline. We compute it once and add a 1-byte jitter.
    const { applyOnCpu } = await import('../cpu-fallback')
    const { createLinearImage, PIXEL_STRIDE } = await import('../../domain/linear-image')
    const { defaultSliderStack, mergeSliderStacks } = await import('../../domain/slider-stack')

    const image = createLinearImage(4, 4)
    const samples = [
      [0.02, 0.02, 0.02],
      [0.18, 0.18, 0.18],
      [0.62, 0.41, 0.21],
      [0.95, 0.92, 0.88],
      [0.05, 0.18, 0.42],
      [0.7, 0.5, 0.3],
      [0.18, 0.5, 0.18],
      [0.5, 0.18, 0.5],
      [0.0, 0.0, 0.0],
      [1.0, 1.0, 1.0],
      [0.3, 0.3, 0.3],
      [0.8, 0.8, 0.8],
      [0.5, 0.55, 0.6],
      [0.55, 0.5, 0.45],
      [0.25, 0.4, 0.6],
      [0.6, 0.4, 0.25],
    ]
    samples.forEach(([r, g, b], i) => {
      image.data.set([r, g, b, 1], i * PIXEL_STRIDE)
    })
    const sliders = mergeSliderStacks(defaultSliderStack(), {
      exposure: 0.5,
      contrast: 25,
      highlights: -30,
      shadows: 20,
      whites: 15,
      blacks: -25,
      temp: -10,
      tint: 5,
      vibrance: 0,
      saturation: 10,
      curvePoints: [
        { x: 0, y: 0.02 },
        { x: 0.5, y: 0.55 },
        { x: 1, y: 0.97 },
      ],
    })
    const cpuExpected = applyOnCpu(image, sliders)

    // Bump three random channels by exactly the tolerance, in opposite directions.
    const jittered = new Uint8ClampedArray(cpuExpected)
    jittered[0] = Math.min(255, jittered[0] + SELF_TEST_TOLERANCE)
    jittered[10] = Math.max(0, jittered[10] - SELF_TEST_TOLERANCE)
    jittered[100] = Math.min(255, jittered[100] + SELF_TEST_TOLERANCE)

    const device = new FakeDevice({ stagingBytes: u8ToFloatSrgb(jittered) })
    expect(await webgpuSelfTest(device as unknown as GPUDevice)).toBe(true)
  })

  it('returns false when the GPU output drifts beyond the tolerance', async () => {
    // All-zero readback against a fixture whose CPU output is non-zero.
    const device = new FakeDevice({ stagingBytes: new Float32Array(4 * 4 * 4) })
    expect(await webgpuSelfTest(device as unknown as GPUDevice)).toBe(false)
  })

  it('treats a length mismatch as a failure', async () => {
    // Seed a too-short readback; the underlying staging buffer keeps its
    // declared byte size, so our wrapper would return a longer output array.
    // Force this by hijacking a buffer's mappedReadback after creation.
    const device = new FakeDevice({ stagingBytes: new Float32Array(4 * 4 * 4) })
    const original = device.createBuffer.bind(device)
    device.createBuffer = ((descriptor: GPUBufferDescriptor) => {
      const buffer = original(descriptor)
      // Shorten the staging buffer's readback to provoke a length mismatch.
      if (descriptor.usage & 1 /* MAP_READ */) {
        buffer.mappedReadback = new ArrayBuffer(4)
      }
      return buffer
    }) as typeof device.createBuffer

    expect(await webgpuSelfTest(device as unknown as GPUDevice)).toBe(false)
  })
})
