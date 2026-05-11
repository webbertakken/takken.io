import { createLinearImage, PIXEL_STRIDE, type LinearImage } from '../../domain/linear-image'
import { defaultSliderStack, mergeSliderStacks, type SliderStack } from '../../domain/slider-stack'
import { applyOnCpu } from '../cpu-fallback'
import { applyOnGpu } from './pipeline'

/** Per-channel byte-difference tolerance (out of 255). */
export const SELF_TEST_TOLERANCE = 3

/**
 * 4×4 fixture covering shadows / midtones / highlights and a colour cast.
 * Stable for every run so a cache of the expected CPU output is meaningful.
 */
const buildSelfTestImage = (): LinearImage => {
  const image = createLinearImage(4, 4)
  const samples: readonly [number, number, number][] = [
    [0.02, 0.02, 0.02], // shadow
    [0.18, 0.18, 0.18], // mid grey
    [0.62, 0.41, 0.21], // warm midtone
    [0.95, 0.92, 0.88], // near-white
    [0.05, 0.18, 0.42], // cool shadow
    [0.7, 0.5, 0.3], // warm highlight
    [0.18, 0.5, 0.18], // greenish midtone
    [0.5, 0.18, 0.5], // magenta midtone
    [0.0, 0.0, 0.0], // pure black
    [1.0, 1.0, 1.0], // pure white
    [0.3, 0.3, 0.3], // dim grey
    [0.8, 0.8, 0.8], // bright grey
    [0.5, 0.55, 0.6], // cool midtone
    [0.55, 0.5, 0.45], // warm midtone 2
    [0.25, 0.4, 0.6], // dawn
    [0.6, 0.4, 0.25], // sunset
  ]
  for (let i = 0; i < samples.length; i++) {
    const idx = i * PIXEL_STRIDE
    image.data[idx + 0] = samples[i][0]
    image.data[idx + 1] = samples[i][1]
    image.data[idx + 2] = samples[i][2]
    image.data[idx + 3] = 1
  }
  return image
}

/** A non-trivial slider stack that exercises every part of the chain. */
const buildSelfTestSliders = (): SliderStack =>
  mergeSliderStacks(defaultSliderStack(), {
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

const exceedsTolerance = (
  expected: Uint8ClampedArray,
  actual: Uint8ClampedArray,
  tolerance: number,
): boolean => {
  if (expected.length !== actual.length) return true
  for (let i = 0; i < expected.length; i++) {
    if (Math.abs(expected[i] - actual[i]) > tolerance) return true
  }
  return false
}

/**
 * Run the slider chain on the GPU and compare against the CPU baseline. A
 * mismatch beyond `SELF_TEST_TOLERANCE` per-channel means the GPU path is
 * unreliable on this device (driver bug, fp16 loss, etc.) and the caller
 * should fall back to CPU.
 */
export const webgpuSelfTest = async (device: GPUDevice): Promise<boolean> => {
  const image = buildSelfTestImage()
  const sliders = buildSelfTestSliders()
  const expected = applyOnCpu(image, sliders)
  let actual: Uint8ClampedArray
  try {
    actual = await applyOnGpu(device, image, sliders)
  } catch {
    /* v8 ignore next 2 */
    return false
  }
  return !exceedsTolerance(expected, actual, SELF_TEST_TOLERANCE)
}
