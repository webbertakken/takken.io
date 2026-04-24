import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import matter from 'gray-matter'
import { globSync } from 'glob'

/**
 * Validates frontmatter for every `.md` / `.mdx` file under `blog/` and
 * `notes/`. Mirrors the checks in `tools/validate-frontmatter.mjs` so the
 * same contract is enforced both locally (pre-commit) and in CI.
 *
 * Catches YAML-parsing bugs like unquoted multi-line descriptions with
 * colons, which pass prettier but break the Docusaurus build.
 */

type CheckedFile = {
  rel: string
  raw: string
  hasFrontmatter: boolean
  isBlogPost: boolean
}

const repoRoot = process.cwd()
const files: CheckedFile[] = globSync('{blog,notes}/**/*.{md,mdx}', {
  cwd: repoRoot,
  absolute: true,
}).map((absPath) => {
  const rel = relative(repoRoot, absPath)
  const raw = readFileSync(absPath, 'utf8')
  return {
    rel,
    raw,
    hasFrontmatter: raw.startsWith('---'),
    isBlogPost: rel.startsWith('blog/') && /\/index\.mdx?$/.test(rel),
  }
})

describe('Frontmatter validation', () => {
  it('finds markdown files to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it('parses as valid YAML', () => {
    const errors: string[] = []
    for (const { rel, raw, hasFrontmatter } of files) {
      if (!hasFrontmatter) continue
      try {
        matter(raw)
      } catch (err) {
        errors.push(`${rel}: ${(err as Error).message}`)
      }
    }
    expect(errors).toEqual([])
  })

  it('has string-typed text fields (slug, title, description)', () => {
    const errors: string[] = []
    for (const { rel, raw, hasFrontmatter } of files) {
      if (!hasFrontmatter) continue
      const data = safeData(raw)
      for (const field of ['slug', 'title', 'description'] as const) {
        if (field in data && typeof data[field] !== 'string') {
          errors.push(`${rel}: \`${field}\` is not a string (got ${typeof data[field]})`)
        }
      }
    }
    expect(errors).toEqual([])
  })

  it('has array-typed list fields (tags, keywords, authors)', () => {
    const errors: string[] = []
    for (const { rel, raw, hasFrontmatter } of files) {
      if (!hasFrontmatter) continue
      const data = safeData(raw)
      for (const field of ['tags', 'keywords', 'authors'] as const) {
        if (field in data && !Array.isArray(data[field])) {
          errors.push(`${rel}: \`${field}\` is not an array (got ${typeof data[field]})`)
        }
      }
    }
    expect(errors).toEqual([])
  })

  it('blog posts have all required fields', () => {
    const errors: string[] = []
    for (const { rel, raw, hasFrontmatter, isBlogPost } of files) {
      if (!isBlogPost || !hasFrontmatter) continue
      const data = safeData(raw)
      for (const field of ['slug', 'title', 'description', 'authors'] as const) {
        if (!(field in data)) {
          errors.push(`${rel}: missing \`${field}\``)
        }
      }
    }
    expect(errors).toEqual([])
  })

  it('blog post descriptions are non-trivial', () => {
    const errors: string[] = []
    for (const { rel, raw, hasFrontmatter, isBlogPost } of files) {
      if (!isBlogPost || !hasFrontmatter) continue
      const data = safeData(raw)
      const d = typeof data.description === 'string' ? data.description.trim() : ''
      if (d.length < 20) {
        errors.push(`${rel}: description is only ${d.length} chars`)
      }
    }
    expect(errors).toEqual([])
  })
})

function safeData(raw: string): Record<string, unknown> {
  try {
    return (matter(raw).data ?? {}) as Record<string, unknown>
  } catch {
    return {}
  }
}
