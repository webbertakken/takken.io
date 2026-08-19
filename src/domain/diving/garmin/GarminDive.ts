import type { Dive } from '@site/src/domain/diving/Dive'
import {
  DiveSummary,
  GarminMessages,
  GarminSession,
  GarminTankSummary,
} from '@site/src/domain/diving/garmin/GarminMessages'
import { Pressure } from '@site/src/domain/diving/Pressure'

/**
 * A tank summary can omit a pressure, or carry a nonsensical one when the pod
 * lost contact. Either way the panel should show a dash instead of failing the
 * whole import.
 */
const readPressure = (bar: number | undefined): Pressure | undefined =>
  bar === undefined || !Number.isFinite(bar) || bar < 0 ? undefined : Pressure.fromBar(bar)

export class GarminDive implements Dive {
  readonly messages: GarminMessages
  private readonly summary: DiveSummary | undefined
  private readonly session: GarminSession | undefined
  private readonly tankSummary: GarminTankSummary | undefined

  constructor(messages: GarminMessages) {
    this.messages = messages
    this.summary = messages.diveSummaryMesgs?.find((m) => m.referenceMesg === 'session')
    this.session = messages.sessionMesgs?.[0]
    this.tankSummary = messages.tankSummaryMesgs?.[0]
  }

  get diveTime() {
    return this.summary ? Math.round(this.summary.bottomTime / 60) : undefined
  }

  get startTime() {
    return this.session ? this.session.startTime : undefined // 202309151957
  }

  get maxDepth() {
    return this.summary ? Math.round(this.summary.maxDepth * 10) / 10 : undefined // 9.6
  }

  get avgDepth() {
    return this.summary ? Math.round(this.summary.avgDepth * 10) / 10 : undefined
  }

  get firstName() {
    return ''
  }

  get lastName() {
    return ''
  }

  get sport() {
    if (!this.session) throw new Error('No session data available')
    return this.session.sport
  }

  get minTemperature() {
    return this.session ? this.session.minTemperature : undefined
  }

  get maxTemperature() {
    return this.session ? this.session.maxTemperature : undefined
  }

  get startPressure() {
    return readPressure(this.tankSummary?.startPressure)
  }

  get endPressure() {
    return readPressure(this.tankSummary?.endPressure)
  }
}
