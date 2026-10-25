import { runCli } from './cli'

/**
 * Strips personal data from a `.fit` file so a real dive can be committed as a
 * test fixture.
 *
 * Usage: tsx tools/fit-sanitiser/index.ts <input.fit> <output.fit> [--force]
 */
process.exit(runCli(process.argv.slice(2), console))
