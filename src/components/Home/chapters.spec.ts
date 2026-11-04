import { describe, expect, it } from 'vitest'
import { chapters } from './chapters'

describe('chapters', () => {
  const entries = chapters.flatMap((chapter) => chapter.entries)

  it('marks exactly the off-site links as external', () => {
    for (const entry of entries) {
      expect(Boolean(entry.external)).toBe(entry.href.startsWith('http'))
    }
  })

  it('never links the same place twice', () => {
    const hrefs = entries.map((entry) => entry.href)

    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})
