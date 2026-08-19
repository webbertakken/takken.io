import { garminDescentScubaFixture } from '@site/src/domain/diving/garmin/__fixtures__/index'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { messageOf, runCli } from './cli'

describe('messageOf', () => {
  it('unwraps an Error and stringifies anything else', () => {
    expect(messageOf(new Error('boom'))).toBe('boom')
    expect(messageOf('plain string throw')).toBe('plain string throw')
  })
})

describe('runCli', () => {
  let directory: string
  let input: string
  let output: string
  let logged: string[]
  let errored: string[]
  const io = {
    log: (message: string) => logged.push(message),
    error: (message: string) => errored.push(message),
  }

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'fit-cli-'))
    input = join(directory, 'dive.fit')
    output = join(directory, 'fixture.fit')
    writeFileSync(input, garminDescentScubaFixture())
    logged = []
    errored = []
  })

  afterEach(() => rmSync(directory, { recursive: true, force: true }))

  it('sanitises the input and reports the sizes', () => {
    expect(runCli([input, output], io)).toBe(0)
    expect(existsSync(output)).toBe(true)
    expect(logged[0]).toMatch(/dive\.fit \(\d+ b\) -> .*fixture\.fit \(\d+ b\)/)
  })

  it('prints usage when an argument is missing', () => {
    expect(runCli([input], io)).toBe(1)
    expect(errored[0]).toMatch(/usage:/)
  })

  it('reports the reason it refused to run', () => {
    writeFileSync(output, 'precious')

    expect(runCli([input, output], io)).toBe(1)
    expect(errored[0]).toMatch(/pass --force to replace it/)
  })

  it('replaces the output when --force is passed, in any position', () => {
    writeFileSync(output, 'stale')

    expect(runCli([input, '--force', output], io)).toBe(0)
    expect(logged[0]).toContain('fixture.fit')
  })

  it('reports a failure to read the input', () => {
    expect(runCli([join(directory, 'missing.fit'), output], io)).toBe(1)
    expect(errored[0]).toMatch(/ENOENT|no such file/i)
  })
})
