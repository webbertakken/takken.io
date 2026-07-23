import { Decoder, Stream } from '@garmin-fit/sdk'
import { describe, expect, it } from 'vitest'
import { suuntoOceanScubaFixture } from './__fixtures__/index'
import { SuuntoDive } from './SuuntoDive'
import type { SuuntoMessages, SuuntoRecord, SuuntoSession } from './SuuntoMessages'

const session = (overrides: Partial<SuuntoSession> = {}): SuuntoSession =>
  ({
    startTime: new Date('2026-07-13T06:33:04.000Z'),
    sport: 'diving',
    totalTimerTime: 3085.531,
    avgDepth: 8.56,
    maxDepth: 11.92,
    avgTemperature: 29,
    maxTemperature: 29,
    ...overrides,
  }) as SuuntoSession

const records = (temps: (number | undefined)[]): SuuntoRecord[] =>
  temps.map((temperature) => ({ timestamp: new Date(), temperature }))

const messages = (overrides: Partial<SuuntoMessages> = {}): SuuntoMessages =>
  ({
    fileIdMesgs: [{ manufacturer: 'suunto', productName: 'Suunto Ocean' }],
    sessionMesgs: [session()],
    recordMesgs: records([undefined, 31, 29, 30]),
    ...overrides,
  }) as SuuntoMessages

const decodeFixture = (): SuuntoMessages => {
  const bytes = suuntoOceanScubaFixture()
  const decoder = new Decoder(Stream.fromByteArray(bytes))
  return decoder.read({ includeUnknownData: false, mergeHeartRates: true })
    .messages as SuuntoMessages
}

describe('SuuntoDive', () => {
  it('rounds total timer time to whole minutes for diveTime', () => {
    expect(new SuuntoDive(messages()).diveTime).toBe(51)
  })

  it('exposes the session start time unchanged', () => {
    expect(new SuuntoDive(messages()).startTime).toEqual(new Date('2026-07-13T06:33:04.000Z'))
  })

  it('rounds max depth to a single decimal', () => {
    expect(new SuuntoDive(messages()).maxDepth).toBe(11.9)
  })

  it('reads the sport from the session', () => {
    expect(new SuuntoDive(messages()).sport).toBe('diving')
  })

  it('takes the minimum defined record temperature as watertemp', () => {
    expect(new SuuntoDive(messages()).minTemperature).toBe(29)
  })

  it('reads the max temperature from the session', () => {
    expect(new SuuntoDive(messages()).maxTemperature).toBe(29)
  })

  it('returns empty first and last names', () => {
    const dive = new SuuntoDive(messages())
    expect(dive.firstName).toBe('')
    expect(dive.lastName).toBe('')
  })

  describe('with the real Suunto Ocean fixture', () => {
    it('maps the decoded dive to the expected values', () => {
      const dive = new SuuntoDive(decodeFixture())

      expect(dive.diveTime).toBe(51)
      expect(dive.startTime).toEqual(new Date('2026-07-13T06:33:04.000Z'))
      expect(dive.maxDepth).toBe(11.9)
      expect(dive.sport).toBe('diving')
      expect(dive.maxTemperature).toBe(29)
      expect(dive.minTemperature).toBe(29)
    })
  })
})
