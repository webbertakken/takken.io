import { describe, expect, it, vi } from 'vitest'
import { embedPresetsToJson, type TextEncoder } from './embed-presets'
import type { PresetSource } from '../types'

const sources: readonly PresetSource[] = [
  { name: 'A', description: 'mood A', sliders: { exposure: 1 } },
  { name: 'B', description: 'mood B', sliders: { exposure: -1 } },
]

const queueEncoder = (responses: (Float32Array | ArrayLike<number>)[]): TextEncoder => {
  let i = 0
  return vi.fn(async () => responses[i++]) as unknown as TextEncoder
}

const epsilon = 1e-6

describe('embedPresetsToJson', () => {
  it('embeds each preset description and returns Preset rows preserving sliders', async () => {
    const encoder = queueEncoder([new Float32Array([3, 4]), new Float32Array([0, 5])])

    const result = await embedPresetsToJson(sources, {
      loadEncoder: async () => encoder,
    })

    expect(encoder).toHaveBeenCalledTimes(2)
    expect(encoder).toHaveBeenCalledWith('mood A')
    expect(encoder).toHaveBeenCalledWith('mood B')
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('A')
    expect(result[0].sliders).toEqual({ exposure: 1 })
  })

  it('L2-normalises the embedding so cosine similarity reduces to dot product', async () => {
    const encoder = queueEncoder([new Float32Array([3, 4])])

    const result = await embedPresetsToJson([sources[0]], {
      loadEncoder: async () => encoder,
    })

    // |[3, 4]| = 5  ->  normalised = [0.6, 0.8]
    expect(result[0].embedding[0]).toBeCloseTo(0.6, 5)
    expect(result[0].embedding[1]).toBeCloseTo(0.8, 5)
    let norm = 0
    for (const v of result[0].embedding) norm += v * v
    expect(Math.sqrt(norm)).toBeGreaterThan(1 - epsilon)
    expect(Math.sqrt(norm)).toBeLessThan(1 + epsilon)
  })

  it('handles a zero vector without dividing by zero', async () => {
    const encoder = queueEncoder([new Float32Array([0, 0, 0])])

    const result = await embedPresetsToJson([sources[0]], {
      loadEncoder: async () => encoder,
    })

    expect(result[0].embedding).toEqual([0, 0, 0])
  })

  it('reports per-preset progress via onPreset', async () => {
    const onPreset = vi.fn()

    await embedPresetsToJson(sources, {
      loadEncoder: async () =>
        queueEncoder([new Float32Array([1, 0]), new Float32Array([0, 1])]),
      onPreset,
    })

    expect(onPreset).toHaveBeenCalledTimes(2)
    expect(onPreset).toHaveBeenCalledWith(0, sources[0])
    expect(onPreset).toHaveBeenCalledWith(1, sources[1])
  })

  it('coerces non-Float32Array embeddings into plain number arrays', async () => {
    const encoder = queueEncoder([{ length: 3, 0: 6, 1: 8, 2: 0 } as ArrayLike<number>])

    const result = await embedPresetsToJson([sources[0]], {
      loadEncoder: async () => encoder,
    })

    expect(result[0].embedding[0]).toBeCloseTo(0.6, 5)
    expect(result[0].embedding[1]).toBeCloseTo(0.8, 5)
    expect(result[0].embedding[2]).toBe(0)
  })

  it('returns an empty array when there are no preset sources', async () => {
    const result = await embedPresetsToJson([], {
      loadEncoder: async () => queueEncoder([]),
    })

    expect(result).toEqual([])
  })
})
