import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Loads a `.fit` fixture as a byte array. Callers pass their own
 * `import.meta.url` as the base, so fixtures stay next to the vendor they
 * belong to. Keeping the file name a parameter also stops Vite from rewriting
 * `new URL('./x.fit', import.meta.url)` into a bundled asset URL.
 *
 * Reads from disk via Node `fs`, so it is usable in vitest (node/jsdom) but not
 * in the browser bundle. Fixtures live here purely for tests.
 */
export function loadFixtureBytes(baseUrl: string, name: string): Uint8Array<ArrayBuffer> {
  const path = fileURLToPath(new URL(name, baseUrl))

  // `readFileSync` yields a Buffer over `ArrayBufferLike`; copying into a fresh
  // Uint8Array gives the plain `ArrayBuffer` backing that `File`/`Blob` expect.
  return new Uint8Array(readFileSync(path)) as Uint8Array<ArrayBuffer>
}
