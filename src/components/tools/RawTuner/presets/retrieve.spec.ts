import { describe, expect, it } from 'vitest'
import { cosineSimilarity, topN } from './retrieve'
import type { Preset } from './types'

const buildPreset = (name: string, embedding: readonly number[]): Preset => ({
  name,
  description: `${name} mood`,
  sliders: { exposure: 0 },
  embedding,
})

const dim2 = (x: number, y: number) =>
  Array.from({ length: 512 }, (_, i) => (i === 0 ? x : i === 1 ? y : 0))

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const v = new Float32Array(dim2(1, 0))
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 6)
  })

  it('returns 0 for orthogonal vectors', () => {
    const a = new Float32Array(dim2(1, 0))
    const b = new Float32Array(dim2(0, 1))
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 6)
  })

  it('returns -1 for opposite vectors', () => {
    const a = new Float32Array(dim2(1, 0))
    const b = new Float32Array(dim2(-1, 0))
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 6)
  })

  it('is invariant to magnitude scaling', () => {
    const a = new Float32Array(dim2(2, 0))
    const b = new Float32Array(dim2(0.5, 0))
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 6)
  })

  it('returns 0 when either vector is the zero vector', () => {
    const a = new Float32Array(512)
    const b = new Float32Array(dim2(1, 0))
    expect(cosineSimilarity(a, b)).toBe(0)
    expect(cosineSimilarity(b, a)).toBe(0)
  })

  it('throws on dimension mismatch', () => {
    expect(() => cosineSimilarity(new Float32Array(2), new Float32Array(3))).toThrow(/dimension/i)
  })
})

describe('topN', () => {
  it('returns the most similar preset first', () => {
    const presets: Preset[] = [
      buildPreset('mood-A', dim2(1, 0)),
      buildPreset('mood-B', dim2(0, 1)),
      buildPreset('mood-C', dim2(0.5, 0.5)),
    ]
    const query = new Float32Array(dim2(1, 0))

    const result = topN(query, presets, 1)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('mood-A')
  })

  it('returns up to N results sorted by similarity (no MMR)', () => {
    const presets: Preset[] = [
      buildPreset('A', dim2(1, 0)),
      buildPreset('B', dim2(0.9, 0.1)),
      buildPreset('C', dim2(0, 1)),
      buildPreset('D', dim2(-1, 0)),
    ]
    const query = new Float32Array(dim2(1, 0))

    const result = topN(query, presets, 3, { mmrLambda: 1 })

    expect(result.map((p) => p.name)).toEqual(['A', 'B', 'C'])
  })

  it('falls back to whatever exists when N > presets.length', () => {
    const presets: Preset[] = [buildPreset('A', dim2(1, 0)), buildPreset('B', dim2(0, 1))]

    expect(topN(new Float32Array(dim2(1, 0)), presets, 5)).toHaveLength(2)
  })

  it('applies an MMR diversity penalty when lambda < 1', () => {
    // Two preset clusters. Without MMR, top-3 = {A, A-like, A-very-like}.
    // With MMR, we want a representative of the second cluster too.
    const presets: Preset[] = [
      buildPreset('A1', dim2(1.0, 0.0)),
      buildPreset('A2', dim2(0.99, 0.01)),
      buildPreset('A3', dim2(0.98, 0.02)),
      buildPreset('B1', dim2(0.0, 1.0)),
    ]
    const query = new Float32Array(dim2(1.0, 0.0))

    // The A cluster sits at sim ~= 0.999 to A1, B1 at 0. Lambda 0.3 means
    // diversity dominates after the first pick, surfacing B1 over the other A's.
    const result = topN(query, presets, 3, { mmrLambda: 0.3 })

    expect(result[0].name).toBe('A1')
    expect(result.map((p) => p.name)).toContain('B1')
  })

  it('returns an empty array when N is zero', () => {
    expect(topN(new Float32Array(512), [buildPreset('A', dim2(1, 0))], 0)).toHaveLength(0)
  })

  it('returns an empty array when the preset list is empty', () => {
    expect(topN(new Float32Array(512), [], 5)).toHaveLength(0)
  })

  it('throws on dimension mismatch between query and preset embeddings', () => {
    const preset = { ...buildPreset('A', [1, 0]), embedding: [1, 0] }

    expect(() => topN(new Float32Array(512), [preset], 1)).toThrow(/dimension/i)
  })
})
