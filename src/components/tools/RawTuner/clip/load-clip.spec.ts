import { describe, expect, it, vi } from 'vitest'
import { createLinearImage } from '../domain/linear-image'
import {
  CLIP_EMBEDDING_DIM,
  DEFAULT_CLIP_MODEL,
  loadClipImageEncoder,
  type FeatureExtractor,
} from './load-clip'

const buildExtractor = (response: Float32Array): FeatureExtractor => {
  return vi.fn(async () => ({ data: response })) as unknown as FeatureExtractor
}

class FakeRawImage {
  constructor(
    public data: Uint8ClampedArray,
    public width: number,
    public height: number,
    public channels: number,
  ) {}
}

describe('loadClipImageEncoder', () => {
  it('asks the pipeline factory for the default CLIP model and the WebGPU backend', async () => {
    const factory = vi.fn(async () => buildExtractor(new Float32Array(CLIP_EMBEDDING_DIM)))

    await loadClipImageEncoder({
      pipelineFactory: factory,
      rawImageCtor: FakeRawImage,
    })

    expect(factory).toHaveBeenCalledTimes(1)
    expect(factory).toHaveBeenCalledWith(
      DEFAULT_CLIP_MODEL,
      expect.objectContaining({ device: 'webgpu' }),
    )
  })

  it('lets callers override the model id and device', async () => {
    const factory = vi.fn(async () => buildExtractor(new Float32Array(CLIP_EMBEDDING_DIM)))

    await loadClipImageEncoder({
      modelId: 'Xenova/clip-vit-large-patch14',
      device: 'wasm',
      pipelineFactory: factory,
      rawImageCtor: FakeRawImage,
    })

    expect(factory).toHaveBeenCalledWith(
      'Xenova/clip-vit-large-patch14',
      expect.objectContaining({ device: 'wasm' }),
    )
  })

  it('forwards progress callbacks through to the factory', async () => {
    const factory = vi.fn(
      async (_id: string, opts: { progress_callback?: (p: unknown) => void }) => {
        opts.progress_callback?.({ status: 'downloading', progress: 25 })
        return buildExtractor(new Float32Array(CLIP_EMBEDDING_DIM))
      },
    )
    const onProgress = vi.fn()

    await loadClipImageEncoder({
      pipelineFactory: factory,
      rawImageCtor: FakeRawImage,
      onProgress,
    })

    expect(onProgress).toHaveBeenCalledWith({ status: 'downloading', progress: 25 })
  })

  it('embeds an image into a 512-dim Float32Array', async () => {
    const expected = new Float32Array(CLIP_EMBEDDING_DIM)
    expected[0] = 0.5
    expected[CLIP_EMBEDDING_DIM - 1] = -0.25
    const extractor = buildExtractor(expected)
    const factory = vi.fn(async () => extractor)

    const encoder = await loadClipImageEncoder({
      pipelineFactory: factory,
      rawImageCtor: FakeRawImage,
    })

    const image = createLinearImage(8, 8)
    image.data.fill(0.18)
    const result = await encoder.embed(image)

    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBe(CLIP_EMBEDDING_DIM)
    expect(result[0]).toBeCloseTo(0.5)
    expect(result[CLIP_EMBEDDING_DIM - 1]).toBeCloseTo(-0.25)
    expect(extractor).toHaveBeenCalledWith(
      expect.any(FakeRawImage),
      expect.objectContaining({ pooling: 'mean', normalize: true }),
    )
  })

  it('passes the converted RGB bytes into the RawImage constructor', async () => {
    const factory = vi.fn(async () => buildExtractor(new Float32Array(CLIP_EMBEDDING_DIM)))
    const ctorCalls: {
      data: Uint8ClampedArray
      width: number
      height: number
      channels: number
    }[] = []
    class SpyingRawImage extends FakeRawImage {
      constructor(data: Uint8ClampedArray, width: number, height: number, channels: number) {
        super(data, width, height, channels)
        ctorCalls.push({ data, width, height, channels })
      }
    }

    const encoder = await loadClipImageEncoder({
      pipelineFactory: factory,
      rawImageCtor: SpyingRawImage,
    })

    const image = createLinearImage(2, 2)
    image.data.set([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1])
    await encoder.embed(image)

    expect(ctorCalls).toHaveLength(1)
    expect(ctorCalls[0].width).toBe(2)
    expect(ctorCalls[0].height).toBe(2)
    expect(ctorCalls[0].channels).toBe(3)
    expect(ctorCalls[0].data.length).toBe(2 * 2 * 3)
  })

  it('coerces a non-Float32Array response into a Float32Array', async () => {
    const factory = vi.fn(async () => {
      return vi.fn(async () => ({
        data: new Float64Array(CLIP_EMBEDDING_DIM).fill(0.1),
      })) as unknown as FeatureExtractor
    })

    const encoder = await loadClipImageEncoder({
      pipelineFactory: factory,
      rawImageCtor: FakeRawImage,
    })

    const result = await encoder.embed(createLinearImage(1, 1))
    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBe(CLIP_EMBEDDING_DIM)
    expect(result[0]).toBeCloseTo(0.1, 4)
  })

  it('throws when the extractor returns the wrong embedding dimensionality', async () => {
    const factory = vi.fn(async () => buildExtractor(new Float32Array(128 /* wrong */)))

    const encoder = await loadClipImageEncoder({
      pipelineFactory: factory,
      rawImageCtor: FakeRawImage,
    })

    await expect(encoder.embed(createLinearImage(1, 1))).rejects.toThrow(
      /embedding dimensionality/i,
    )
  })
})
