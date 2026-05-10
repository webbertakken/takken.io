import { afterEach, describe, expect, it } from 'vitest'
import { createLinearImage, PIXEL_STRIDE } from '../../domain/linear-image'
import { defaultSliderStack, mergeSliderStacks } from '../../domain/slider-stack'
import { FakeBuffer, FakeDevice, installFakeNavigatorGpu } from './fake-device'
import { applyOnGpu, createPipeline, HSL_BUFFER_FLOATS, requestWebGpuDevice } from './pipeline'
import { MAX_CURVE_POINTS, SLIDER_UNIFORM_FLOATS, WORKGROUP_SIZE } from './shader'

const restorers: (() => void)[] = []

afterEach(() => {
  while (restorers.length) restorers.pop()?.()
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

const stagingForBytes = (...rgba: number[]): Float32Array => {
  // Helper for crafting fake readback values. Each tuple of 4 floats is one
  // pixel of sRGB-encoded RGBA.
  return new Float32Array(rgba)
}

describe('requestWebGpuDevice', () => {
  it('returns null when navigator.gpu is unavailable', async () => {
    restorers.push(installFakeNavigatorGpu(null))

    expect(await requestWebGpuDevice()).toBeNull()
  })

  it('returns the device when navigator.gpu exposes one', async () => {
    const fake = new FakeDevice()
    restorers.push(installFakeNavigatorGpu(fake))

    const device = await requestWebGpuDevice()

    expect(device).toBe(fake)
  })

  it('returns null when the adapter cannot be acquired', async () => {
    const navigatorAny = globalThis as { navigator?: { gpu?: unknown } }
    const original = navigatorAny.navigator?.gpu
    Object.defineProperty(navigatorAny.navigator!, 'gpu', {
      value: { requestAdapter: async () => null },
      configurable: true,
      writable: true,
    })
    restorers.push(() =>
      Object.defineProperty(navigatorAny.navigator!, 'gpu', {
        value: original,
        configurable: true,
        writable: true,
      }),
    )

    expect(await requestWebGpuDevice()).toBeNull()
  })
})

describe('createPipeline', () => {
  it('builds a compute pipeline with the WGSL shader as its source', () => {
    const device = new FakeDevice()
    createPipeline(device as unknown as GPUDevice)

    expect(device.shaderModules).toHaveLength(1)
    expect(device.shaderModules[0].code).toContain('@compute @workgroup_size(64)')
    expect(device.pipelines).toHaveLength(1)
  })
})

describe('applyOnGpu', () => {
  it('exposes the eight-channel HSL buffer ABI even though v1 ignores it', () => {
    expect(HSL_BUFFER_FLOATS).toBe(24)
  })

  it('writes the input image, slider uniform, and curve buffer in the right shape', async () => {
    const image = buildImage(2, 2, 0.5)
    const sliders = mergeSliderStacks(defaultSliderStack(), { exposure: 1, contrast: 30 })

    const fake = new FakeDevice({
      stagingBytes: new Float32Array(image.data.length).fill(0),
    })
    await applyOnGpu(fake as unknown as GPUDevice, image, sliders)

    // Three writes: input, slider uniform, curve points.
    expect(fake.queue.writes).toHaveLength(3)
    const [inputWrite, sliderWrite, curveWrite] = fake.queue.writes

    // Input matches the image bytes.
    expect(new Float32Array(inputWrite.data)).toEqual(image.data)

    // Slider uniform layout matches SLIDER_UNIFORM_FLOATS.
    const sliderArray = new Float32Array(sliderWrite.data)
    expect(sliderArray.length).toBe(SLIDER_UNIFORM_FLOATS)
    expect(sliderArray[0]).toBe(1) // exposure
    expect(sliderArray[1]).toBe(30) // contrast

    // Curve buffer: identity has two points (0,0)(1,1).
    const curveArray = new Float32Array(curveWrite.data)
    expect(curveArray.length).toBe(MAX_CURVE_POINTS * 2)
    expect(Array.from(curveArray.slice(0, 4))).toEqual([0, 0, 1, 1])
  })

  it('records a single bind group with four buffer entries', async () => {
    const fake = new FakeDevice({ stagingBytes: new Float32Array(4 * 1) })
    await applyOnGpu(fake as unknown as GPUDevice, buildImage(1, 1, 0.5), defaultSliderStack())

    expect(fake.bindGroups).toHaveLength(1)
    expect(fake.bindGroups[0].entries).toHaveLength(4)
    const bindings = (fake.bindGroups[0].entries as readonly GPUBindGroupEntry[]).map(
      (e) => e.binding,
    )
    expect(bindings).toEqual([0, 1, 2, 3])
  })

  it('dispatches ceil(pixels / WORKGROUP_SIZE) workgroups in the X dimension', async () => {
    const fake = new FakeDevice({ stagingBytes: new Float32Array(100 * 4) })
    await applyOnGpu(fake as unknown as GPUDevice, buildImage(10, 10, 0), defaultSliderStack())

    expect(fake.passes).toHaveLength(1)
    expect(fake.passes[0].dispatched).toEqual({
      workgroupCountX: Math.ceil(100 / WORKGROUP_SIZE),
      workgroupCountY: 1,
      workgroupCountZ: 1,
    })
  })

  it('reads back the staged output and converts to clamped 8-bit RGBA', async () => {
    // 1 pixel: shader wrote (1, 0.5, 0, 1) sRGB-encoded.
    const fake = new FakeDevice({ stagingBytes: stagingForBytes(1, 0.5, 0, 1) })
    const out = await applyOnGpu(
      fake as unknown as GPUDevice,
      buildImage(1, 1, 0),
      defaultSliderStack(),
    )

    expect(out).toBeInstanceOf(Uint8ClampedArray)
    expect(out.length).toBe(4)
    expect(out[0]).toBe(255)
    expect(out[1]).toBe(128)
    expect(out[2]).toBe(0)
    expect(out[3]).toBe(255)
  })

  it('clamps super-bright and negative readback values', async () => {
    const fake = new FakeDevice({ stagingBytes: stagingForBytes(2, -0.5, 0.5, 1) })
    const out = await applyOnGpu(
      fake as unknown as GPUDevice,
      buildImage(1, 1, 0),
      defaultSliderStack(),
    )

    expect(out[0]).toBe(255)
    expect(out[1]).toBe(0)
    expect(out[2]).toBe(128)
  })

  it('reuses the pipeline cache when provided', async () => {
    const fake = new FakeDevice({ stagingBytes: new Float32Array(4) })
    const pipeline = createPipeline(fake as unknown as GPUDevice)
    expect(fake.pipelines).toHaveLength(1)

    await applyOnGpu(fake as unknown as GPUDevice, buildImage(1, 1, 0), defaultSliderStack(), {
      pipelineCache: { device: fake as unknown as GPUDevice, pipeline },
    })

    // Still only the one pipeline that we built up-front.
    expect(fake.pipelines).toHaveLength(1)
  })

  it('destroys the transient buffers after readback', async () => {
    const fake = new FakeDevice({ stagingBytes: new Float32Array(4) })
    await applyOnGpu(fake as unknown as GPUDevice, buildImage(1, 1, 0), defaultSliderStack())

    for (const buffer of fake.buffers) {
      expect((buffer as FakeBuffer).destroyed).toBe(true)
    }
  })
})
