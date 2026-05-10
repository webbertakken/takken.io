import type { Preset } from './types'

const dot = (a: ArrayLike<number>, b: ArrayLike<number>): number => {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

const norm = (a: ArrayLike<number>): number => Math.sqrt(dot(a, a))

/**
 * Cosine similarity in `[-1, 1]`. Returns 0 when either vector is all zeros
 * (avoids divide-by-zero). Throws on dimension mismatch.
 */
export const cosineSimilarity = (a: ArrayLike<number>, b: ArrayLike<number>): number => {
  if (a.length !== b.length) {
    throw new Error(`cosineSimilarity dimension mismatch: ${a.length} vs ${b.length}`)
  }
  const denom = norm(a) * norm(b)
  if (denom === 0) return 0
  return dot(a, b) / denom
}

export interface TopNOptions {
  /**
   * MMR diversity lambda: 1 = pure similarity, 0 = pure diversity. Default
   * 0.7 favours similarity but still surfaces variety after the top hit.
   */
  mmrLambda?: number
}

/**
 * Pick the top-N most similar presets to `imageEmbedding`, with an MMR
 * diversity penalty so the recommendations don't all look identical.
 *
 * Algorithm:
 *   1. Score every preset by cosine similarity to the query.
 *   2. Greedily select the highest-scoring preset.
 *   3. For each subsequent slot, pick the preset that maximises
 *      `lambda * sim(p, q) - (1 - lambda) * max sim(p, p_selected)`.
 */
export const topN = (
  imageEmbedding: ArrayLike<number>,
  presets: readonly Preset[],
  n: number,
  options: TopNOptions = {},
): readonly Preset[] => {
  if (n <= 0 || presets.length === 0) return []

  const lambda = options.mmrLambda ?? 0.7
  const queryScores = presets.map((p) => cosineSimilarity(imageEmbedding, p.embedding))

  const selected: number[] = []
  const remaining = new Set(presets.map((_, i) => i))
  const cap = Math.min(n, presets.length)

  // First pick: best raw similarity.
  let bestIndex = 0
  for (let i = 1; i < presets.length; i++) {
    if (queryScores[i] > queryScores[bestIndex]) bestIndex = i
  }
  selected.push(bestIndex)
  remaining.delete(bestIndex)

  while (selected.length < cap && remaining.size > 0) {
    let next = -1
    let bestMmr = -Infinity
    for (const i of remaining) {
      let maxSimToSelected = -Infinity
      for (const j of selected) {
        const s = cosineSimilarity(presets[i].embedding, presets[j].embedding)
        if (s > maxSimToSelected) maxSimToSelected = s
      }
      const mmr = lambda * queryScores[i] - (1 - lambda) * maxSimToSelected
      if (mmr > bestMmr) {
        bestMmr = mmr
        next = i
      }
    }
    /* v8 ignore next */
    if (next < 0) break
    selected.push(next)
    remaining.delete(next)
  }

  return selected.map((i) => presets[i])
}
