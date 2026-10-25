import type { FitMessages } from '@site/src/domain/diving/fit/FitMessages'

/**
 * The decoded message set of a Suunto app `.fit` export (observed on a Suunto
 * Ocean scuba dive). Suunto files carry no `sportMesgs` or `diveSummaryMesgs`,
 * so the session message is the primary source and `recordMesgs` supply the
 * per-sample temperature the session lacks a minimum for.
 */
export interface SuuntoMessages extends FitMessages {
  fileIdMesgs: SuuntoFileId[]
  sessionMesgs?: SuuntoSession[]
  recordMesgs?: SuuntoRecord[]
  diveSettingsMesgs?: SuuntoDiveSettings[]
  diveGasMesgs?: SuuntoDiveGas[]
}

export interface SuuntoFileId {
  type: string // 'activity'
  timeCreated: Date
  manufacturer: 'suunto' | string
  product: number // 62
  productName: string // 'Suunto Ocean'
}

export interface SuuntoSession {
  timestamp: Date // '2026-07-13T07:24:30.000Z'
  startTime: Date // '2026-07-13T06:33:04.000Z'
  sport: 'diving' | string
  totalTimerTime: number // 3085.531 seconds
  totalElapsedTime: number // 3085.3
  avgDepth: number // 8.56
  maxDepth: number // 11.92
  diveNumber: number // 1
  surfaceInterval: number // 20170 seconds
  avgTemperature: number // 29
  maxTemperature: number // 29
}

export interface SuuntoRecord {
  timestamp: Date
  depth?: number // sampled roughly every 10s
  temperature?: number // present on nearly every record
  verticalSpeed?: number
  distance?: number
}

export interface SuuntoDiveSettings {
  messageIndex: number // 0
  gfLow: number // 45
  gfHigh: number // 90
}

export interface SuuntoDiveGas {
  messageIndex: number // 0
  oxygenContent: number // 21
  heliumContent: number // 0
  status: string // 'enabled'
}
