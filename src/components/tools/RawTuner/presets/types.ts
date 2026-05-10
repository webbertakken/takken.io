import type { SliderStack } from '../domain/slider-stack'

/**
 * A `SliderStackPatch`-shaped subset of `SliderStack` that the user describes
 * in YAML. The build script promotes this into a full embedded preset
 * (`Preset`) by running CLIP's text encoder on `description`.
 */
export interface PresetSource {
  readonly name: string
  readonly description: string
  readonly sliders: Partial<Omit<SliderStack, 'curvePoints' | 'hsl'>> & {
    curvePoints?: readonly { x: number; y: number }[]
  }
}

export interface Preset extends PresetSource {
  /** Pre-computed CLIP text embedding (length 512). */
  readonly embedding: readonly number[]
}
