import type { LinearImage } from '../domain/linear-image'
import { linearToSrgbRgb } from './raw-image-bridge'

/** CLIP ViT-B/32 produces 512-d embeddings. */
export const CLIP_EMBEDDING_DIM = 512

export const DEFAULT_CLIP_MODEL = 'Xenova/clip-vit-base-patch32'

export interface ClipImageEncoder {
  embed(image: LinearImage): Promise<Float32Array>
}

/**
 * Subset of `transformers.js`'s pipeline result that we depend on. Kept
 * loose so we don't have to keep the type up-to-date with their internals.
 */
export type FeatureExtractor = (
  input: unknown,
  options?: { pooling?: string; normalize?: boolean },
) => Promise<{ data: ArrayLike<number> }>

interface PipelineFactoryOptions {
  device: 'webgpu' | 'wasm'
  progress_callback?: (progress: unknown) => void
  [key: string]: unknown
}

export type PipelineFactory = (
  modelId: string,
  options: PipelineFactoryOptions,
) => Promise<FeatureExtractor>

export type RawImageCtor = new (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  channels: 1 | 2 | 3 | 4,
) => unknown

export interface LoadClipOptions {
  modelId?: string
  device?: 'webgpu' | 'wasm'
  onProgress?: (progress: unknown) => void
  /** Inject the transformers.js `pipeline()` for unit tests. */
  pipelineFactory?: PipelineFactory
  /** Inject the transformers.js `RawImage` constructor for unit tests. */
  rawImageCtor?: RawImageCtor
}

/* v8 ignore start -- transformers.js can't be loaded under jsdom; the integration
   path runs against the real lib in Phase 9 manual smoke. */
const defaultPipelineFactory: PipelineFactory = async (modelId, options) => {
  const { pipeline } = (await import('@huggingface/transformers')) as {
    pipeline: (
      task: string,
      modelId: string,
      options: PipelineFactoryOptions,
    ) => Promise<FeatureExtractor>
  }
  return pipeline('image-feature-extraction', modelId, options)
}

const defaultRawImageCtor = async (): Promise<RawImageCtor> => {
  const { RawImage } = (await import('@huggingface/transformers')) as {
    RawImage: RawImageCtor
  }
  return RawImage
}
/* v8 ignore stop */

const toFloat32 = (data: ArrayLike<number>): Float32Array =>
  data instanceof Float32Array ? data : Float32Array.from(data)

/**
 * Acquire a CLIP image-feature extractor and return an encoder that embeds
 * `LinearImage` instances into 512-d feature vectors. The transformers.js
 * pipeline + the `RawImage` constructor are injectable so unit tests don't
 * touch the real model files.
 */
export const loadClipImageEncoder = async (
  options: LoadClipOptions = {},
): Promise<ClipImageEncoder> => {
  const {
    modelId = DEFAULT_CLIP_MODEL,
    device = 'webgpu',
    onProgress,
    pipelineFactory = defaultPipelineFactory,
    rawImageCtor,
  } = options
  const RawImage = rawImageCtor ?? (await defaultRawImageCtor())

  // v8's coverage statement-tracking is flaky on async-await assignments; the
  // line below IS executed by every test that reaches loadClipImageEncoder,
  // but `DA:` reports 0. Forced-ignore so the tool reflects reality.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  /* v8 ignore next */
  const extractor = await pipelineFactory(modelId, { device, progress_callback: onProgress })

  return {
    async embed(image: LinearImage): Promise<Float32Array> {
      const { data, width, height } = linearToSrgbRgb(image)
      const rawImage = new RawImage(data, width, height, 3)
      const result = await extractor(rawImage, { pooling: 'mean', normalize: true })
      const features = toFloat32(result.data)
      if (features.length !== CLIP_EMBEDDING_DIM) {
        throw new Error(
          `CLIP returned unexpected embedding dimensionality: ${features.length} (expected ${CLIP_EMBEDDING_DIM})`,
        )
      }
      return features
    },
  }
}
