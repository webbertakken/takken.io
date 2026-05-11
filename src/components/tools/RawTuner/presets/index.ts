import presetsJson from './presets.json'
import type { Preset } from './types'

/**
 * Build-time-generated preset bank. Run `yarn raw-tuner:embed-presets` to
 * regenerate after editing `presets.source.ts`. The committed JSON is the
 * source of truth at runtime; the source TS is the source for humans.
 */
export const PRESETS: readonly Preset[] = presetsJson as readonly Preset[]
