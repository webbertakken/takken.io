/**
 * Test-only fake `GPUDevice` that records every call and lets tests inject
 * synthetic readback data. Lives next to the production code so the unit
 * tests that mock WebGPU can lean on the same shape the wrapper expects.
 *
 * Intentionally simple: it does not interpret the WGSL shader. Tests verify
 * that the wrapper builds the right buffers, bindings, and dispatch, then
 * read whatever bytes the test pre-loaded into the staging buffer.
 */

export interface RecordedWriteBuffer {
  buffer: FakeBuffer
  offset: number
  data: ArrayBuffer
}

export interface RecordedDispatch {
  workgroupCountX: number
  workgroupCountY: number
  workgroupCountZ: number
}

export interface RecordedCopy {
  source: FakeBuffer
  sourceOffset: number
  destination: FakeBuffer
  destinationOffset: number
  size: number
}

export class FakeBuffer {
  readonly label: string
  readonly size: number
  readonly usage: number
  // The bytes the test wants the consumer to read back when this buffer is mapped.
  mappedReadback: ArrayBuffer
  destroyed = false
  // Tracks whether the buffer is currently mapped (mapAsync -> getMappedRange -> unmap).
  isMapped = false
  // Set by FakeDevice when this is a MAP_READ buffer; runs at mapAsync time so
  // it can observe all writes that happened between createBuffer and mapAsync.
  resolveReadback?: () => void

  constructor(descriptor: GPUBufferDescriptor) {
    this.label = descriptor.label ?? ''
    this.size = Number(descriptor.size)
    this.usage = descriptor.usage
    this.mappedReadback = new ArrayBuffer(this.size)
  }

  async mapAsync(): Promise<void> {
    this.resolveReadback?.()
    this.isMapped = true
  }

  getMappedRange(): ArrayBuffer {
    if (!this.isMapped) throw new Error('FakeBuffer.getMappedRange called before mapAsync')
    return this.mappedReadback
  }

  unmap(): void {
    this.isMapped = false
  }

  destroy(): void {
    this.destroyed = true
  }
}

class FakeQueue {
  readonly writes: RecordedWriteBuffer[] = []
  readonly submits: number[] = []

  writeBuffer(buffer: FakeBuffer, offset: number, data: BufferSource): void {
    const view = ArrayBuffer.isView(data)
      ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice().buffer
      : (data as ArrayBuffer).slice(0)
    this.writes.push({ buffer, offset, data: view })
  }

  submit(commandBuffers: unknown[]): void {
    this.submits.push(commandBuffers.length)
  }
}

class FakeComputePass {
  readonly device: FakeDevice
  pipeline: unknown = null
  bindGroups: { index: number; group: unknown }[] = []
  dispatched: RecordedDispatch | null = null

  constructor(device: FakeDevice) {
    this.device = device
  }

  setPipeline(pipeline: unknown): void {
    this.pipeline = pipeline
  }

  setBindGroup(index: number, group: unknown): void {
    this.bindGroups.push({ index, group })
  }

  dispatchWorkgroups(x: number, y = 1, z = 1): void {
    this.dispatched = { workgroupCountX: x, workgroupCountY: y, workgroupCountZ: z }
  }

  end(): void {
    this.device.passes.push(this)
  }
}

class FakeCommandEncoder {
  readonly device: FakeDevice
  readonly copies: RecordedCopy[] = []
  finished = false

  constructor(device: FakeDevice) {
    this.device = device
  }

  beginComputePass(): FakeComputePass {
    return new FakeComputePass(this.device)
  }

  copyBufferToBuffer(
    source: FakeBuffer,
    sourceOffset: number,
    destination: FakeBuffer,
    destinationOffset: number,
    size: number,
  ): void {
    this.copies.push({ source, sourceOffset, destination, destinationOffset, size })
  }

  finish(): { copies: RecordedCopy[] } {
    this.finished = true
    return { copies: this.copies }
  }
}

export interface FakeDeviceOptions {
  /** Pre-load bytes into every MAP_READ buffer created. */
  stagingBytes?: Float32Array
  /**
   * Callback invoked when a MAP_READ buffer is created. Receives the queue of
   * `writeBuffer` entries observed so far so the test can compute the synthetic
   * readback dynamically.
   */
  stagingProducer?: (writes: readonly RecordedWriteBuffer[]) => Float32Array
}

export class FakeDevice {
  readonly buffers: FakeBuffer[] = []
  readonly bindGroups: GPUBindGroupDescriptor[] = []
  readonly passes: FakeComputePass[] = []
  readonly shaderModules: { code: string }[] = []
  readonly pipelines: { module: { code: string } }[] = []
  readonly queue: FakeQueue = new FakeQueue()

  options: FakeDeviceOptions = {}

  constructor(options: FakeDeviceOptions = {}) {
    this.options = options
  }

  createShaderModule(descriptor: GPUShaderModuleDescriptor): { code: string } {
    const module = { code: descriptor.code }
    this.shaderModules.push(module)
    return module
  }

  createComputePipeline(descriptor: {
    layout: 'auto'
    compute: { module: { code: string }; entryPoint: string }
  }): { module: { code: string }; getBindGroupLayout: () => unknown } {
    const pipeline = {
      module: descriptor.compute.module,
      getBindGroupLayout: () => ({}),
    }
    this.pipelines.push(pipeline)
    return pipeline
  }

  createBuffer(descriptor: GPUBufferDescriptor): FakeBuffer {
    const buffer = new FakeBuffer(descriptor)
    this.buffers.push(buffer)
    if (descriptor.usage & 1 /* GPUBufferUsage.MAP_READ */) {
      // Defer to mapAsync so the producer can see writeBuffer calls that
      // happen between createBuffer and the readback.
      buffer.resolveReadback = () => {
        const bytes = this.options.stagingProducer
          ? this.options.stagingProducer(this.queue.writes)
          : this.options.stagingBytes
        if (bytes) {
          buffer.mappedReadback = new ArrayBuffer(bytes.byteLength)
          new Float32Array(buffer.mappedReadback).set(bytes)
        }
      }
    }
    return buffer
  }

  createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroupDescriptor {
    this.bindGroups.push(descriptor)
    return descriptor
  }

  createCommandEncoder(): FakeCommandEncoder {
    return new FakeCommandEncoder(this)
  }

  destroy(): void {}
}

/** Install a `navigator.gpu` shim that returns the supplied FakeDevice. */
export const installFakeNavigatorGpu = (device: FakeDevice | null): (() => void) => {
  const navigatorAny = globalThis as { navigator?: { gpu?: unknown } }
  const original = navigatorAny.navigator?.gpu
  const fakeGpu =
    device === null
      ? undefined
      : {
          requestAdapter: async () => ({
            requestDevice: async () => device,
          }),
        }
  /* v8 ignore next 3 -- navigator is always defined in jsdom + browsers */
  if (!navigatorAny.navigator) {
    navigatorAny.navigator = { gpu: fakeGpu }
  } else {
    Object.defineProperty(navigatorAny.navigator, 'gpu', {
      value: fakeGpu,
      configurable: true,
      writable: true,
    })
  }
  return () => {
    if (!navigatorAny.navigator) return
    Object.defineProperty(navigatorAny.navigator, 'gpu', {
      value: original,
      configurable: true,
      writable: true,
    })
  }
}
