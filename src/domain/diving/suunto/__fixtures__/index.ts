import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Loads a `.fit` fixture from this directory as a byte array.
 *
 * Reads from disk via Node `fs`, so it is usable in vitest (node/jsdom) but not
 * in the browser bundle. Fixtures live here purely for tests.
 */
export function loadFixtureBytes(name: string): Uint8Array {
  const path = fileURLToPath(new URL(name, import.meta.url))
  return new Uint8Array(readFileSync(path))
}

/** Simo's real Suunto Ocean scuba dive (2026-07-13), verified free of PII. */
export const suuntoOceanScubaFixture = (): Uint8Array =>
  loadFixtureBytes('./suunto-ocean-scuba.fit')
