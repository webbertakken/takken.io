import { createLinearImage, type LinearImage } from '../domain/linear-image'
import { defaultSliderStack, type SliderStack } from '../domain/slider-stack'
import { applyOnCpu } from './cpu-fallback'
import {
  applyOnGpu,
  createPipeline,
  requestWebGpuDevice,
  type GpuPipelineCache,
} from './webgpu/pipeline'
import { webgpuSelfTest } from './webgpu/self-test'

export type ApplierDecision = 'gpu' | 'cpu'

interface ApplierState {
  decision: ApplierDecision | null
  pipelineCache: GpuPipelineCache | null
  prewarmed: boolean
  /** Awaitable in-flight initialisation so concurrent callers don't double-probe. */
  initialising: Promise<void> | null
}

const state: ApplierState = {
  decision: null,
  pipelineCache: null,
  prewarmed: false,
  initialising: null,
}

const initialise = async (): Promise<void> => {
  if (state.initialising) {
    await state.initialising
    return
  }
  state.initialising = (async () => {
    const device = await requestWebGpuDevice()
    if (!device) {
      state.decision = 'cpu'
      return
    }
    const ok = await webgpuSelfTest(device)
    if (!ok) {
      state.decision = 'cpu'
      return
    }
    state.decision = 'gpu'
    state.pipelineCache = { device, pipeline: createPipeline(device) }
  })()
  try {
    await state.initialising
  } finally {
    state.initialising = null
  }
}

/**
 * Apply the slider stack and return sRGB-encoded RGBA bytes. On first call
 * the applier probes WebGPU + runs the self-test; subsequent calls reuse the
 * cached pipeline. Falls back to the CPU path whenever the GPU is missing,
 * the self-test fails, or the GPU dispatch throws.
 */
export const apply = async (
  image: LinearImage,
  sliders: SliderStack,
): Promise<Uint8ClampedArray> => {
  if (state.decision === null) await initialise()
  if (state.decision === 'gpu' && state.pipelineCache) {
    try {
      return await applyOnGpu(state.pipelineCache.device, image, sliders, {
        pipelineCache: state.pipelineCache,
      })
    } catch (error) {
      // A runtime failure flips us permanently to CPU - kinder than a flaky preview.
      // eslint-disable-next-line no-console
      console.warn('[raw-tuner] GPU apply failed, falling back to CPU:', error)
      state.decision = 'cpu'
      state.pipelineCache = null
    }
  }
  return applyOnCpu(image, sliders)
}

/**
 * Pre-compile the GPU pipeline by firing a 1×1 dummy compute on first call.
 * Subsequent calls are no-ops within the same session. Safe to call from the
 * tool's `useEffect(() => { prewarmGpu() }, [])` so the first real edit isn't
 * stuck on a 200-2000ms shader compile.
 */
export const prewarmGpu = async (): Promise<void> => {
  if (state.prewarmed) return
  state.prewarmed = true
  await apply(createLinearImage(1, 1), defaultSliderStack())
}

/** Reset the applier state. Test-only; production code never resets. */
export const resetApplierState = (): void => {
  state.decision = null
  state.pipelineCache = null
  state.prewarmed = false
  state.initialising = null
}

export const getApplierDecision = (): ApplierDecision | null => state.decision
