import {
  DiveSummary,
  GarminMessages,
  GarminSession,
} from '@site/src/domain/diving/garmin/GarminMessages'

export class GarminDive {
  readonly messages: GarminMessages
  private readonly summary: DiveSummary | undefined
  private readonly session: GarminSession | undefined

  constructor(messages: GarminMessages) {
    this.messages = messages
    this.summary = messages.diveSummaryMesgs?.find((m) => m.referenceMesg === 'session')
    this.session = messages.sessionMesgs?.[0]
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

  get firstName() {
    return ''
  }

  get lastName() {
    return ''
  }

  get sport() {
    return this.session.sport
  }

  get minTemperature() {
    return this.session.minTemperature
  }

  get maxTemperature() {
    return this.session.maxTemperature
  }
}
