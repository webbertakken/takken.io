import { garminDescentScubaFixture } from '@site/src/domain/diving/garmin/__fixtures__/index'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { sanitiseFile } from './sanitiseFile'

describe('sanitiseFile', () => {
  let directory: string
  let input: string
  let output: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'fit-sanitiser-'))
    input = join(directory, 'dive.fit')
    output = join(directory, 'fixture.fit')
    writeFileSync(input, garminDescentScubaFixture())
  })

  afterEach(() => rmSync(directory, { recursive: true, force: true }))

  it('writes a sanitised copy and reports both sizes', () => {
    const result = sanitiseFile(input, output)

    expect(result.originalSize).toBe(garminDescentScubaFixture().length)
    expect(readFileSync(output)).toHaveLength(result.sanitisedSize)
  })

  it('refuses to write over the file it is reading', () => {
    expect(() => sanitiseFile(input, join(directory, '.', 'dive.fit'))).toThrow(
      'Input and output must be different files',
    )
    expect(readFileSync(input)).toHaveLength(garminDescentScubaFixture().length)
  })

  it('refuses to replace an existing output', () => {
    writeFileSync(output, 'precious')

    expect(() => sanitiseFile(input, output)).toThrow('pass --force to replace it')
    expect(readFileSync(output, 'utf8')).toBe('precious')
  })

  it('replaces an existing output when forced', () => {
    writeFileSync(output, 'stale')

    sanitiseFile(input, output, { force: true })

    expect(readFileSync(output, 'utf8')).not.toBe('stale')
  })
})
