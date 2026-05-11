import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createLinearImage, PIXEL_STRIDE } from '../domain/linear-image'
import { defaultSliderStack, mergeSliderStacks } from '../domain/slider-stack'
import { applyOnCpu } from './cpu-fallback'
import { apply, getApplierDecision, prewarmGpu, resetApplierState } from './index'
import { FakeDevice, installFakeNavigatorGpu } from './webgpu/fake-device'

const restorers: (() => void)[] = []

beforeEach(() => {
  resetApplierState()
})

afterEach(() => {
  while (restorers.length) restorers.pop()?.()
  resetApplierState()
})

const buildImage = (width: number, height: number, fill: number) => {
  const data = new Float32Array(width * height * PIXEL_STRIDE)
  for (let i = 0; i < width * height; i++) {
    data[i * PIXEL_STRIDE + 0] = fill
    data[i * PIXEL_STRIDE + 1] = fill
    data[i * PIXEL_STRIDE + 2] = fill
    data[i * PIXEL_STRIDE + 3] = 1
  }
  return createLinearImage(width, height, data)
}

const u8ToFloatSrgb = (bytes: Uint8ClampedArray): Float32Array => {
  const out = new Float32Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] / 255
  return out
}

describe('apply (selector)', () => {
  it('falls back to CPU when WebGPU is unavailable', async () => {
    restorers.push(installFakeNavigatorGpu(null))

    const image = buildImage(2, 2, 0.5)
    const sliders = mergeSliderStacks(defaultSliderStack(), { exposure: 1 })
    const result = await apply(image, sliders)

    expect(getApplierDecision()).toBe('cpu')
    expect(Array.from(result)).toEqual(Array.from(applyOnCpu(image, sliders)))
  })

  it('falls back to CPU when the GPU self-test fails', async () => {
    // FakeDevice with no preloaded staging will yield zero readback,
    // breaking the byte-for-byte comparison against the CPU baseline.
    restorers.push(installFakeNavigatorGpu(new FakeDevice()))

    const image = buildImage(2, 2, 0.5)
    const result = await apply(image, defaultSliderStack())

    expect(getApplierDecision()).toBe('cpu')
    expect(Array.from(result)).toEqual(Array.from(applyOnCpu(image, defaultSliderStack())))
  })

  it('uses the GPU path when the device passes self-test', async () => {
    // Two dispatches happen on the first apply():
    //   1) the self-test fixture (4x4, complex sliders) - we want CPU baseline output here.
    //   2) the user's actual image with its own sliders - we want CPU baseline output here too.
    // Producing the right bytes per dispatch means inspecting the last 'input'
    // write before each MAP_READ buffer creation.
    const dispatchInputs: {
      width: number
      data: Float32Array
      sliders: typeof defaultSliderStack extends () => infer S ? S : never
    }[] = []
    const fake = new FakeDevice({
      stagingProducer: (writes) => {
        // The wrapper writes input first, then sliders, then curve, before the
        // MAP_READ buffer is created. Distinguish by buffer label so the test
        // doesn't drift if the order ever changes.
        const inputWrite = writes.findLast((w) => w.buffer.label === 'raw-tuner.input')
        if (!inputWrite) return new Float32Array(0)
        const inputFloats = new Float32Array(inputWrite.data)
        const pixels = inputFloats.length / 4
        const dim = Math.round(Math.sqrt(pixels))
        const sliderWrite = writes.findLast((w) => w.buffer.label === 'raw-tuner.sliders')
        const sliderArr = sliderWrite ? new Float32Array(sliderWrite.data) : new Float32Array(12)
        const curveWrite = writes.findLast((w) => w.buffer.label === 'raw-tuner.curve')
        const curvePoints: { x: number; y: number }[] = []
        if (curveWrite) {
          const curveArr = new Float32Array(curveWrite.data)
          const count = new Uint32Array(sliderArr.buffer, sliderArr.byteOffset + 10 * 4, 1)[0]
          for (let i = 0; i < count; i++) {
            curvePoints.push({ x: curveArr[i * 2], y: curveArr[i * 2 + 1] })
          }
        }
        const sliders = mergeSliderStacks(defaultSliderStack(), {
          exposure: sliderArr[0],
          contrast: sliderArr[1],
          highlights: sliderArr[2],
          shadows: sliderArr[3],
          whites: sliderArr[4],
          blacks: sliderArr[5],
          temp: sliderArr[6],
          tint: sliderArr[7],
          vibrance: sliderArr[8],
          saturation: sliderArr[9],
          curvePoints: curvePoints.length > 0 ? curvePoints : undefined,
        })
        const image = createLinearImage(dim, dim, inputFloats)
        const expected = applyOnCpu(image, sliders)
        dispatchInputs.push({ width: dim, data: inputFloats, sliders })
        return u8ToFloatSrgb(expected)
      },
    })
    restorers.push(installFakeNavigatorGpu(fake))

    const image = buildImage(2, 2, 0.5)
    const sliders = mergeSliderStacks(defaultSliderStack(), { exposure: 1 })
    const result = await apply(image, sliders)

    expect(getApplierDecision()).toBe('gpu')
    expect(dispatchInputs.length).toBeGreaterThanOrEqual(2) // self-test + user
    expect(Array.from(result)).toEqual(Array.from(applyOnCpu(image, sliders)))

    // Subsequent call reuses the pipeline.
    const pipelinesBefore = fake.pipelines.length
    await apply(image, sliders)
    expect(fake.pipelines.length).toBe(pipelinesBefore)
  })

  it('flips to CPU when a GPU dispatch throws after a successful initialise', async () => {
    let count = 0
    const fake = new FakeDevice({
      stagingProducer: (writes) => {
        // Pass self-test by faithfully reconstructing sliders + curve from the
        // observed buffer writes, then computing the CPU baseline. Then break
        // the user dispatch with a thrown error from createCommandEncoder.
        const inputWrite = writes.findLast((w) => w.buffer.label === 'raw-tuner.input')
        if (!inputWrite) return new Float32Array(0)
        const inputFloats = new Float32Array(inputWrite.data)
        const pixels = inputFloats.length / 4
        const dim = Math.round(Math.sqrt(pixels))
        const sliderWrite = writes.findLast((w) => w.buffer.label === 'raw-tuner.sliders')
        const sliderArr = sliderWrite ? new Float32Array(sliderWrite.data) : new Float32Array(12)
        const curveWrite = writes.findLast((w) => w.buffer.label === 'raw-tuner.curve')
        const curvePoints: { x: number; y: number }[] = []
        if (curveWrite) {
          const curveArr = new Float32Array(curveWrite.data)
          const count2 = new Uint32Array(sliderArr.buffer, sliderArr.byteOffset + 10 * 4, 1)[0]
          for (let i = 0; i < count2; i++) {
            curvePoints.push({ x: curveArr[i * 2], y: curveArr[i * 2 + 1] })
          }
        }
        const sliders = mergeSliderStacks(defaultSliderStack(), {
          exposure: sliderArr[0],
          contrast: sliderArr[1],
          highlights: sliderArr[2],
          shadows: sliderArr[3],
          whites: sliderArr[4],
          blacks: sliderArr[5],
          temp: sliderArr[6],
          tint: sliderArr[7],
          vibrance: sliderArr[8],
          saturation: sliderArr[9],
          curvePoints: curvePoints.length > 0 ? curvePoints : undefined,
        })
        return u8ToFloatSrgb(applyOnCpu(createLinearImage(dim, dim, inputFloats), sliders))
      },
    })
    const originalCreate = fake.createCommandEncoder.bind(fake)
    fake.createCommandEncoder = (() => {
      count++
      // The first encoder call is the self-test, the second is the user dispatch.
      if (count === 2) throw new Error('boom')
      return originalCreate()
    }) as typeof fake.createCommandEncoder
    restorers.push(installFakeNavigatorGpu(fake))

    const image = buildImage(1, 1, 0.5)
    const result = await apply(image, defaultSliderStack())
    expect(getApplierDecision()).toBe('cpu')
    expect(Array.from(result)).toEqual(Array.from(applyOnCpu(image, defaultSliderStack())))
  })

  it('caches the decision so subsequent calls skip the probe', async () => {
    restorers.push(installFakeNavigatorGpu(null))

    await apply(buildImage(1, 1, 0), defaultSliderStack())
    expect(getApplierDecision()).toBe('cpu')

    // Once cached as cpu, swap navigator.gpu to a fake and confirm we don't
    // re-probe.
    const fake = new FakeDevice()
    restorers.push(installFakeNavigatorGpu(fake))

    await apply(buildImage(1, 1, 0), defaultSliderStack())
    expect(fake.shaderModules).toHaveLength(0) // would have compiled if probed
  })

  it('serialises concurrent first-call probes', async () => {
    restorers.push(installFakeNavigatorGpu(null))

    const [a, b, c] = await Promise.all([
      apply(buildImage(1, 1, 0), defaultSliderStack()),
      apply(buildImage(1, 1, 0), defaultSliderStack()),
      apply(buildImage(1, 1, 0), defaultSliderStack()),
    ])

    expect(getApplierDecision()).toBe('cpu')
    expect(a.length).toBe(b.length)
    expect(b.length).toBe(c.length)
  })
})

describe('prewarmGpu', () => {
  it('runs once per session and is a no-op on subsequent calls', async () => {
    restorers.push(installFakeNavigatorGpu(null))

    await prewarmGpu()
    expect(getApplierDecision()).toBe('cpu')

    // Second call: shouldn't change state.
    await prewarmGpu()
    expect(getApplierDecision()).toBe('cpu')
  })
})
