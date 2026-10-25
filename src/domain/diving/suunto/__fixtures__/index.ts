import { loadFixtureBytes } from '@site/src/domain/diving/__fixtures__/loadFixtureBytes'

/** Simo's real Suunto Ocean scuba dive (2026-07-13), verified free of PII. */
export const suuntoOceanScubaFixture = (): Uint8Array<ArrayBuffer> =>
  loadFixtureBytes(import.meta.url, './suunto-ocean-scuba.fit')
