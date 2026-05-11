import { PIXEL_STRIDE, type LinearImage } from '../../domain/linear-image'
import { COLOR_CHANNELS, type SliderStack } from '../../domain/slider-stack'
import { MAX_CURVE_POINTS, SHADER_WGSL, SLIDER_UNIFORM_FLOATS, WORKGROUP_SIZE } from './shader'

const SLIDER_UNIFORM_BYTES = SLIDER_UNIFORM_FLOATS * 4

// WebGPU bitflag constants. Hard-coded against the spec so the wrapper works
// in jsdom and other environments where the globals aren't defined.
const USAGE_MAP_READ = 0x0001
const USAGE_COPY_SRC = 0x0004
const USAGE_COPY_DST = 0x0008
const USAGE_UNIFORM = 0x0040
const USAGE_STORAGE = 0x0080
const MAP_MODE_READ = 0x0001

export interface GpuPipelineCache {
  device: GPUDevice
  pipeline: GPUComputePipeline
}

/** Try to acquire a WebGPU device. Returns `null` on any failure. */
export const requestWebGpuDevice = async (): Promise<GPUDevice | null> => {
  const gpu = (globalThis as { navigator?: { gpu?: GPU } }).navigator?.gpu
  if (!gpu) return null
  try {
    const adapter = await gpu.requestAdapter()
    if (!adapter) return null
    return await adapter.requestDevice()
  } catch {
    /* v8 ignore next */
    return null
  }
}

export const createPipeline = (device: GPUDevice): GPUComputePipeline => {
  const module = device.createShaderModule({ code: SHADER_WGSL })
  return device.createComputePipeline({
    layout: 'auto',
    compute: { module, entryPoint: 'main' },
  })
}

const writeSliderUniform = (sliders: SliderStack): Float32Array => {
  // Uses the ABI laid out in `shader.ts` (SLIDER_UNIFORM_FLOATS):
  // [exposure, contrast, highlights, shadows, whites, blacks, temp, tint,
  //  vibrance, saturation, curveCount, _pad]
  const buffer = new Float32Array(SLIDER_UNIFORM_FLOATS)
  buffer[0] = sliders.exposure
  buffer[1] = sliders.contrast
  buffer[2] = sliders.highlights
  buffer[3] = sliders.shadows
  buffer[4] = sliders.whites
  buffer[5] = sliders.blacks
  buffer[6] = sliders.temp
  buffer[7] = sliders.tint
  buffer[8] = sliders.vibrance
  buffer[9] = sliders.saturation
  // curveCount is a u32 in WGSL; store as int by aliasing into Uint32Array.
  new Uint32Array(buffer.buffer, 10 * 4, 1)[0] = Math.min(
    sliders.curvePoints.length,
    MAX_CURVE_POINTS,
  )
  // index 11 stays 0 as padding.
  return buffer
}

const writeCurveBuffer = (sliders: SliderStack): Float32Array => {
  const count = Math.min(sliders.curvePoints.length, MAX_CURVE_POINTS)
  const buffer = new Float32Array(MAX_CURVE_POINTS * 2)
  for (let i = 0; i < count; i++) {
    buffer[i * 2 + 0] = sliders.curvePoints[i].x
    buffer[i * 2 + 1] = sliders.curvePoints[i].y
  }
  return buffer
}

// Eight per-channel HSL adjustments, kept here for forward compatibility even
// though the v1 shader doesn't read them. Storing them now means the binding
// layout doesn't need to change when HSL lands.
export const HSL_BUFFER_FLOATS = COLOR_CHANNELS.length * 3

export interface ApplyOnGpuOptions {
  /** Provide a pre-built pipeline to skip recompilation across calls. */
  pipelineCache?: GpuPipelineCache
}

/**
 * Run the slider chain on the GPU and return the result as a sRGB-encoded
 * 8-bit RGBA byte buffer. The result is byte-for-byte comparable with
 * `applyOnCpu` (modulo last-bit GPU rounding differences).
 */
export const applyOnGpu = async (
  device: GPUDevice,
  image: LinearImage,
  sliders: SliderStack,
  options: ApplyOnGpuOptions = {},
): Promise<Uint8ClampedArray> => {
  const pixels = image.width * image.height
  const inputBytes = pixels * PIXEL_STRIDE * 4 // f32 RGBA
  const outputBytes = inputBytes
  const curveBytes = MAX_CURVE_POINTS * 2 * 4

  const pipeline = options.pipelineCache?.pipeline ?? createPipeline(device)

  const inputBuffer = device.createBuffer({
    label: 'raw-tuner.input',
    size: inputBytes,
    usage: USAGE_STORAGE | USAGE_COPY_DST,
  })
  const outputBuffer = device.createBuffer({
    label: 'raw-tuner.output',
    size: outputBytes,
    usage: USAGE_STORAGE | USAGE_COPY_SRC,
  })
  const sliderBuffer = device.createBuffer({
    label: 'raw-tuner.sliders',
    size: SLIDER_UNIFORM_BYTES,
    usage: USAGE_UNIFORM | USAGE_COPY_DST,
  })
  const curveBuffer = device.createBuffer({
    label: 'raw-tuner.curve',
    size: curveBytes,
    usage: USAGE_STORAGE | USAGE_COPY_DST,
  })
  const stagingBuffer = device.createBuffer({
    label: 'raw-tuner.staging',
    size: outputBytes,
    usage: USAGE_MAP_READ | USAGE_COPY_DST,
  })

  device.queue.writeBuffer(inputBuffer, 0, image.data)
  device.queue.writeBuffer(sliderBuffer, 0, writeSliderUniform(sliders))
  device.queue.writeBuffer(curveBuffer, 0, writeCurveBuffer(sliders))

  const bindGroup = device.createBindGroup({
    label: 'raw-tuner.binding',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: inputBuffer } },
      { binding: 1, resource: { buffer: outputBuffer } },
      { binding: 2, resource: { buffer: sliderBuffer } },
      { binding: 3, resource: { buffer: curveBuffer } },
    ],
  })

  const encoder = device.createCommandEncoder({ label: 'raw-tuner.encoder' })
  const pass = encoder.beginComputePass({ label: 'raw-tuner.pass' })
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.dispatchWorkgroups(Math.ceil(pixels / WORKGROUP_SIZE))
  pass.end()
  encoder.copyBufferToBuffer(outputBuffer, 0, stagingBuffer, 0, outputBytes)
  device.queue.submit([encoder.finish()])

  await stagingBuffer.mapAsync(MAP_MODE_READ)
  const linear = new Float32Array(stagingBuffer.getMappedRange().slice(0))
  stagingBuffer.unmap()

  // The shader writes sRGB-encoded values in [0,1]. Convert to bytes with the
  // same rounding the CPU path uses so outputs match across paths.
  const out = new Uint8ClampedArray(linear.length)
  for (let i = 0; i < linear.length; i++) {
    out[i] = Math.round(Math.max(0, Math.min(1, linear[i])) * 255)
  }

  inputBuffer.destroy()
  outputBuffer.destroy()
  sliderBuffer.destroy()
  curveBuffer.destroy()
  stagingBuffer.destroy()
  return out
}
