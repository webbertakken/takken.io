import { sanitiseFile } from './sanitiseFile'

const usage = 'usage: tsx tools/fit-sanitiser/index.ts <input.fit> <output.fit> [--force]'

/** Anything can be thrown in JavaScript; report it either way. */
export const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

export interface CliOutput {
  log: (message: string) => void
  error: (message: string) => void
}

/**
 * Runs the sanitiser from command-line arguments and returns the exit code, so
 * failures (bad usage, unreadable input, refusing to clobber) are reported
 * rather than thrown at the terminal.
 */
export const runCli = (argv: string[], output: CliOutput): number => {
  const force = argv.includes('--force')
  const [source, target] = argv.filter((arg) => arg !== '--force')

  if (!source || !target) {
    output.error(usage)

    return 1
  }

  try {
    const { originalSize, sanitisedSize } = sanitiseFile(source, target, { force })

    output.log(`${source} (${originalSize} b) -> ${target} (${sanitisedSize} b)`)

    return 0
  } catch (error) {
    output.error(messageOf(error))

    return 1
  }
}
