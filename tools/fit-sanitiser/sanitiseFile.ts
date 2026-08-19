import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { diveFixtureProfile } from './diveFixtureProfile'
import { sanitiseFit } from './sanitiseFit'

export interface SanitiseFileOptions {
  /** Allow replacing an existing output file. */
  force?: boolean
}

export interface SanitiseFileResult {
  originalSize: number
  sanitisedSize: number
}

/**
 * Sanitises `input` into `output`. Refuses to write over the source file, and
 * refuses to replace an existing output unless told to: the input is usually
 * the only copy of a real dive.
 */
export const sanitiseFile = (
  input: string,
  output: string,
  { force = false }: SanitiseFileOptions = {},
): SanitiseFileResult => {
  if (resolve(input) === resolve(output)) {
    throw new Error('Input and output must be different files')
  }

  if (!force && existsSync(output)) {
    throw new Error(`${output} already exists; pass --force to replace it`)
  }

  const original = new Uint8Array(readFileSync(input))
  const sanitised = sanitiseFit(original, diveFixtureProfile)

  writeFileSync(output, sanitised, force ? undefined : { flag: 'wx' })

  return { originalSize: original.length, sanitisedSize: sanitised.length }
}
