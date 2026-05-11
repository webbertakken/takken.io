import { readFileSync, existsSync } from 'fs'
import { glob } from 'glob'
import { join } from 'path'
import { describe, it, expect, beforeAll } from 'vitest'

/**
 * RAW tuner ships heavy deps (libraw-wasm, transformers.js / CLIP) that must
 * NOT bleed into any other route's bundle. These tests inspect the built
 * artefacts and fail loudly if a non-tool page accidentally pulls in
 * RawTuner code or its heavy transitive deps.
 *
 * Run via `yarn build` (which invokes `yarn security-check` post-build).
 */

const buildDir = join(process.cwd(), 'build')

const RAW_TUNER_MARKERS = ['RAW tuner', 'RawTuner']

const HEAVY_DEP_MARKERS = [
  // Anything that signals libraw-wasm or transformers.js leaked into a chunk
  'libraw-wasm',
  '@huggingface/transformers',
]

describe('RAW tuner build isolation', () => {
  beforeAll(() => {
    if (!existsSync(buildDir)) {
      throw new Error('Build directory does not exist. Run "yarn build" first.')
    }
  })

  it('emits dedicated chunks containing RawTuner source', async () => {
    const chunks = await glob('assets/js/*.js', { cwd: buildDir, absolute: true })
    const matches = chunks.filter((chunk) => {
      const content = readFileSync(chunk, 'utf-8')
      return RAW_TUNER_MARKERS.some((marker) => content.includes(marker))
    })

    expect(matches.length).toBeGreaterThan(0)
  })

  it('does not include RawTuner code in the main entry chunks', async () => {
    const mainChunks = await glob('assets/js/main.*.js', { cwd: buildDir, absolute: true })
    const leaks: string[] = []

    for (const chunk of mainChunks) {
      const content = readFileSync(chunk, 'utf-8')
      for (const marker of RAW_TUNER_MARKERS) {
        if (content.includes(marker)) {
          leaks.push(`${marker} leaked into ${chunk}; main entry should stay lean`)
        }
      }
    }

    expect(leaks).toEqual([])
  })

  it('does not include RawTuner heavy deps in any non-raw-tuner HTML', async () => {
    const htmls = await glob('**/*.html', {
      cwd: buildDir,
      absolute: true,
      ignore: ['tools/raw-tuner/**'],
    })
    const leaks: string[] = []

    for (const html of htmls) {
      const content = readFileSync(html, 'utf-8')
      for (const marker of HEAVY_DEP_MARKERS) {
        if (content.includes(marker)) {
          leaks.push(`${marker} inlined in ${html}; should be dynamically imported only`)
        }
      }
    }

    expect(leaks).toEqual([])
  })
})
