#!/usr/bin/env node
/**
 * Validates frontmatter for `.md` / `.mdx` files.
 *
 * Catches the kinds of mistakes that slip past prettier but break the
 * Docusaurus build - most notably unquoted multi-line scalars that contain
 * a colon, which YAML parses as a mapping key instead of part of the string.
 *
 * Usage:
 *   node tools/validate-frontmatter.mjs [files...]
 *
 * When invoked with no arguments, validates every `.md` / `.mdx` file under
 * `blog/` and `notes/`. When invoked via lint-staged, the staged file paths
 * are passed as arguments.
 */
import { readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import matter from 'gray-matter'
import { globSync } from 'glob'

const repoRoot = process.cwd()
const args = process.argv.slice(2)

const targets =
  args.length > 0
    ? args
        .map((p) => resolve(p))
        .filter((p) => /\.mdx?$/.test(p))
        .filter((p) => {
          const rel = relative(repoRoot, p)
          return rel.startsWith('blog/') || rel.startsWith('notes/')
        })
    : globSync('{blog,notes}/**/*.{md,mdx}', { cwd: repoRoot, absolute: true })

const errors = []

for (const absPath of targets) {
  const rel = relative(repoRoot, absPath)
  const raw = readFileSync(absPath, 'utf8')

  // Files without frontmatter delimiters are allowed (e.g. plain notes).
  if (!raw.startsWith('---')) continue

  let parsed
  try {
    parsed = matter(raw)
  } catch (err) {
    errors.push(`${rel}: YAML parse error — ${err.message}`)
    continue
  }

  const data = parsed.data ?? {}
  const isBlogPost = rel.startsWith('blog/') && /\/index\.mdx?$/.test(rel)
  const isAuthors = rel === 'blog/authors.yml'
  if (isAuthors) continue

  // Shape checks that apply whenever a field is present.
  const stringFields = ['slug', 'title', 'description']
  for (const field of stringFields) {
    if (field in data && typeof data[field] !== 'string') {
      errors.push(`${rel}: \`${field}\` must be a string, got ${typeof data[field]}`)
    }
  }
  const arrayFields = ['tags', 'keywords', 'authors']
  for (const field of arrayFields) {
    if (field in data && !Array.isArray(data[field])) {
      errors.push(`${rel}: \`${field}\` must be an array, got ${typeof data[field]}`)
    }
  }

  // Blog posts have a richer contract - it is what shows up in RSS, search
  // results and the blog index page.
  if (isBlogPost) {
    const required = ['slug', 'title', 'description', 'authors']
    for (const field of required) {
      if (!(field in data)) {
        errors.push(`${rel}: missing required field \`${field}\``)
      }
    }
    if (typeof data.description === 'string' && data.description.trim().length < 20) {
      errors.push(
        `${rel}: \`description\` is suspiciously short (${data.description.trim().length} chars) — ` +
          `check that a colon didn't eat the rest of it`,
      )
    }
  }
}

if (errors.length > 0) {
  console.error('Frontmatter validation failed:\n')
  for (const e of errors) console.error(`  ✗ ${e}`)
  console.error('')
  process.exit(1)
}

console.log(`✓ Frontmatter OK (${targets.length} file${targets.length === 1 ? '' : 's'} checked)`)
