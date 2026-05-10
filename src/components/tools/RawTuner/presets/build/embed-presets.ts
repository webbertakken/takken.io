/**
 * Build-time script. Reads `presets.source.ts`, runs CLIP's text encoder
 * over each preset's `description`, writes `presets.json` with the
 * embeddings baked in. Run locally with:
 *
 *     yarn raw-tuner:embed-presets
 *
 * The output is committed alongside the source. CI does NOT regenerate;
 * regenerating only happens when a human edits `presets.source.ts` and
 * runs the script. This keeps Cloudflare Pages deploys lightweight (no
 * 150 MB CLIP weights download in CI).
 */

import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PRESET_SOURCES } from '../presets.source'
import type { Preset, PresetSource } from '../types'

const here = dirname(fileURLToPath(import.meta.url))
const outputPath = join(here, '..', 'presets.json')

/**
 * Embeds a single description string into a Float32Array. Decoupled from the
 * underlying model implementation so tests inject a fake without touching
 * transformers.js + downloading 150 MB of weights.
 */
export interface TextEncoder {
  (text: string): Promise<Float32Array | ArrayLike<number>>
}

type LoadEncoder = () => Promise<TextEncoder>

/* v8 ignore start -- requires the real CLIP weights; exercised by
   `yarn raw-tuner:embed-presets` locally, never in unit tests. */
const defaultLoadEncoder: LoadEncoder = async () => {
  const transformers = (await import('@huggingface/transformers')) as unknown as {
    AutoTokenizer: { from_pretrained: (id: string) => Promise<unknown> }
    CLIPTextModelWithProjection: {
      from_pretrained: (id: string, opts?: { device?: string }) => Promise<unknown>
    }
  }
  const modelId = 'Xenova/clip-vit-base-patch32'
  const tokenizer = (await transformers.AutoTokenizer.from_pretrained(modelId)) as unknown as (
    text: string,
    options?: { padding?: boolean; truncation?: boolean },
  ) => unknown
  const model = (await transformers.CLIPTextModelWithProjection.from_pretrained(modelId, {
    device: 'cpu',
  })) as unknown as (inputs: unknown) => Promise<{
    text_embeds: { data: Float32Array | ArrayLike<number> }
  }>

  return async (text: string) => {
    const inputs = tokenizer(text, { padding: true, truncation: true })
    const result = await model(inputs)
    return result.text_embeds.data
  }
}
/* v8 ignore stop */

export interface EmbedOptions {
  loadEncoder?: LoadEncoder
  onPreset?: (index: number, source: PresetSource) => void
}

const l2Normalise = (data: Float32Array | ArrayLike<number>): number[] => {
  let norm = 0
  for (let i = 0; i < data.length; i++) norm += data[i] * data[i]
  norm = Math.sqrt(norm) || 1
  const out: number[] = new Array(data.length)
  for (let i = 0; i < data.length; i++) out[i] = data[i] / norm
  return out
}

export const embedPresetsToJson = async (
  sources: readonly PresetSource[],
  options: EmbedOptions = {},
): Promise<readonly Preset[]> => {
  const loadEncoder = options.loadEncoder ?? defaultLoadEncoder
  const encode = await loadEncoder()

  const out: Preset[] = []
  for (let i = 0; i < sources.length; i++) {
    options.onPreset?.(i, sources[i])
    const raw = await encode(sources[i].description)
    out.push({ ...sources[i], embedding: l2Normalise(raw) })
  }
  return out
}

/* v8 ignore start -- CLI entry point, exercised by `yarn raw-tuner:embed-presets`. */
const isMain = (() => {
  try {
    return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
  } catch {
    return false
  }
})()

if (isMain) {
  void (async () => {
    const presets = await embedPresetsToJson(PRESET_SOURCES, {
      onPreset: (i, source) => {
        process.stdout.write(`[${i + 1}/${PRESET_SOURCES.length}] ${source.name}...\n`)
      },
    })
    await writeFile(outputPath, JSON.stringify(presets, null, 2))
    process.stdout.write(`Wrote ${presets.length} presets to ${outputPath}\n`)
  })().catch((error: unknown) => {
    process.stderr.write(`Embed-presets failed: ${String(error)}\n`)
    process.exit(1)
  })
}
/* v8 ignore stop */
