import type { Dive } from '@site/src/domain/diving/Dive'
import type { SuuntoMessages, SuuntoSession } from '@site/src/domain/diving/suunto/SuuntoMessages'

/**
 * A dive parsed from a Suunto app `.fit` export. Suunto files lack the
 * `diveSummaryMesgs` and `minTemperature` that `GarminDive` relies on, so dive
 * time comes from the session's `totalTimerTime` and the minimum water
 * temperature is derived from `recordMesgs` (falling back to `avgTemperature`).
 */
export class SuuntoDive implements Dive {
  readonly messages: SuuntoMessages
  private readonly session: SuuntoSession | undefined

  constructor(messages: SuuntoMessages) {
    this.messages = messages
    this.session = messages.sessionMesgs?.[0]
  }

  get diveTime(): number | undefined {
    return this.session ? Math.round(this.session.totalTimerTime / 60) : undefined
  }

  get startTime(): Date | undefined {
    return this.session?.startTime
  }

  get maxDepth(): number | undefined {
    return this.session ? Math.round(this.session.maxDepth * 10) / 10 : undefined
  }

  get sport(): string {
    if (!this.session) throw new Error('No session data available')
    return this.session.sport
  }

  get minTemperature(): number | undefined {
    const temperatures = (this.messages.recordMesgs ?? [])
      .map((record) => record.temperature)
      .filter((temperature): temperature is number => temperature !== undefined)

    if (temperatures.length >= 1) return Math.min(...temperatures)

    return this.session?.avgTemperature
  }

  get maxTemperature(): number | undefined {
    return this.session?.maxTemperature
  }

  get firstName(): string {
    return ''
  }

  get lastName(): string {
    return ''
  }
}
