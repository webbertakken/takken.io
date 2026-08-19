import { readFileSync, writeFileSync } from 'node:fs'
import { diveFixtureProfile } from './diveFixtureProfile'
import { sanitiseFit } from './sanitiseFit'

/**
 * Strips personal data from a `.fit` file so a real dive can be committed as a
 * test fixture.
 *
 * Usage: tsx tools/fit-sanitiser/index.ts <input.fit> <output.fit>
 */
const [input, output] = process.argv.slice(2)

if (!input || !output) {
  console.error('usage: tsx tools/fit-sanitiser/index.ts <input.fit> <output.fit>')
  process.exit(1)
}

const original = new Uint8Array(readFileSync(input))
const sanitised = sanitiseFit(original, diveFixtureProfile)

writeFileSync(output, sanitised)
console.log(`${input} (${original.length} b) -> ${output} (${sanitised.length} b)`)
