import type { FitMessages } from '@site/src/domain/diving/fit/FitMessages'

/**
 * A single dive parsed from a FIT file, exposed in a vendor-neutral shape so the
 * SSI mapping and the shared tool UI can consume Garmin and Suunto dives
 * identically. Vendor adapters (e.g. `GarminDive`, `SuuntoDive`) implement this.
 */
export interface Dive {
  /** The raw decoded messages, for the developer-data view. */
  readonly messages: FitMessages
  /** Dive duration in whole minutes, or `undefined` when not recorded. */
  readonly diveTime: number | undefined
  /** Moment the dive started, or `undefined` when not recorded. */
  readonly startTime: Date | undefined
  /** Maximum depth in metres (one decimal), or `undefined` when not recorded. */
  readonly maxDepth: number | undefined
  /** FIT sport identifier (e.g. `'diving'`); throws when it cannot be read. */
  readonly sport: string
  /** Minimum water temperature in °C, or `undefined` when not recorded. */
  readonly minTemperature: number | undefined
  /** Maximum water temperature in °C, or `undefined` when not recorded. */
  readonly maxTemperature: number | undefined
  /** Diver first name (empty when the file carries none). */
  readonly firstName: string
  /** Diver last name (empty when the file carries none). */
  readonly lastName: string
}
