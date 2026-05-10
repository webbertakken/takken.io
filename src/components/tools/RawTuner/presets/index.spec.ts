import { describe, expect, it } from 'vitest'
import { PRESETS } from './index'
import { PRESET_SOURCES } from './presets.source'

describe('PRESETS (preset bank)', () => {
  it('has the same number of presets as the source', () => {
    expect(PRESETS).toHaveLength(PRESET_SOURCES.length)
  })

  it('preserves the source name and description in lockstep', () => {
    for (let i = 0; i < PRESET_SOURCES.length; i++) {
      expect(PRESETS[i].name).toBe(PRESET_SOURCES[i].name)
      expect(PRESETS[i].description).toBe(PRESET_SOURCES[i].description)
    }
  })

  it('every preset has a 512-dim L2-normalised embedding', () => {
    for (const preset of PRESETS) {
      expect(preset.embedding).toHaveLength(512)
      let norm = 0
      for (const v of preset.embedding) norm += v * v
      expect(Math.sqrt(norm)).toBeCloseTo(1, 3)
    }
  })

  it('preserves the source slider patches in the same order', () => {
    for (let i = 0; i < PRESET_SOURCES.length; i++) {
      expect(PRESETS[i].sliders).toEqual(PRESET_SOURCES[i].sliders)
    }
  })

  it('produces sensible top-1 retrievals for a description-matching query', async () => {
    const { topN } = await import('./retrieve')
    // Use one of the preset's own embeddings as the "query" - top-1 must be itself.
    const reference = PRESETS[5]
    const result = topN(reference.embedding, PRESETS, 1, { mmrLambda: 1 })
    expect(result[0].name).toBe(reference.name)
  })
})
