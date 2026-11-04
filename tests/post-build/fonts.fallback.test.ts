import { readFileSync } from 'fs'
import { glob } from 'glob'
import { join } from 'path'
import { beforeAll, describe, expect, it } from 'vitest'

const fallbacks = ['Menlo', 'Consolas', 'DejaVu', 'Liberation'].map(
  (name) => `Fira Mono ${name} fallback`,
)

describe('Fira Mono fallback fonts', () => {
  let css = ''

  beforeAll(async () => {
    const files = await glob(join(process.cwd(), 'build/assets/css/*.css'))
    css = files.map((file) => readFileSync(file, 'utf8')).join('\n')
  })

  it.each(fallbacks)('ships a metric-matched face for %s', (family) => {
    const faces = css.match(/@font-face\{[^}]*\}/g) ?? []
    const face = faces.find((rule) => rule.includes(family))

    expect(face).toMatch(/size-adjust:[\d.]+%/)
    expect(face).toMatch(/ascent-override:[\d.]+%/)
  })

  it('tries every fallback straight after Fira Mono', () => {
    const stack = css.match(/--font-base:([^;]+);/)?.[1].replace(/["']/g, '') ?? ''
    const families = stack.split(',').map((family) => family.trim())

    expect(families.slice(0, 5)).toEqual(['Fira Mono', ...fallbacks])
  })
})
