import { loadFixtureBytes } from '@site/src/domain/diving/__fixtures__/loadFixtureBytes'

/**
 * A real Garmin Descent scuba dive (2026-05-23) with air-integration data,
 * sanitised via `tools/fit-sanitiser`: GPS, device serials, tank-pod sensor id,
 * heart rate and the user profile are stripped, dive data is untouched.
 */
export const garminDescentScubaFixture = (): Uint8Array<ArrayBuffer> =>
  loadFixtureBytes(import.meta.url, './garmin-descent-scuba.fit')
