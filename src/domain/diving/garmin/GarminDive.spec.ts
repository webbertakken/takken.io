import { Decoder, Stream } from '@garmin-fit/sdk'
import { describe, expect, it } from 'vitest'
import { garminDescentScubaFixture } from './__fixtures__/index'
import { GarminDive } from './GarminDive'
import type {
  DiveSummary,
  GarminMessages,
  GarminSession,
  GarminTankSummary,
} from './GarminMessages'

const session = (overrides: Partial<GarminSession> = {}): GarminSession =>
  ({
    startTime: new Date('2023-09-15T17:57:17.000Z'),
    sport: 'diving',
    subSport: 'singleGasDiving',
    avgTemperature: 23,
    maxTemperature: 24,
    minTemperature: 22,
    ...overrides,
  }) as GarminSession

const summary = (overrides: Partial<DiveSummary> = {}): DiveSummary =>
  ({
    referenceMesg: 'session',
    bottomTime: 2074.407,
    maxDepth: 9.624,
    avgDepth: 3.809,
    ...overrides,
  }) as DiveSummary

const tankSummary = (overrides: Partial<GarminTankSummary> = {}): GarminTankSummary =>
  ({
    startPressure: 159.75,
    endPressure: 100.8,
    ...overrides,
  }) as GarminTankSummary

const messages = (overrides: Partial<GarminMessages> = {}): GarminMessages =>
  ({
    sessionMesgs: [session()],
    diveSummaryMesgs: [summary()],
    tankSummaryMesgs: [tankSummary()],
    ...overrides,
  }) as GarminMessages

describe('GarminDive', () => {
  it('rounds bottom-time seconds to whole minutes for diveTime', () => {
    expect(new GarminDive(messages()).diveTime).toBe(35)
  })

  it('exposes the session start time unchanged', () => {
    expect(new GarminDive(messages()).startTime).toEqual(new Date('2023-09-15T17:57:17.000Z'))
  })

  it('rounds max depth to a single decimal', () => {
    expect(new GarminDive(messages()).maxDepth).toBe(9.6)
  })

  it('rounds average depth to a single decimal', () => {
    expect(new GarminDive(messages()).avgDepth).toBe(3.8)
  })

  it('reads start and end pressure from the tank summary', () => {
    const dive = new GarminDive(messages())

    expect(dive.startPressure?.bar).toBe(159.75)
    expect(dive.startPressure?.formatPsi()).toBe('2317 psi')
    expect(dive.endPressure?.bar).toBe(100.8)
    expect(dive.endPressure?.formatBar()).toBe('100.8 bar')
  })

  it('reads only the first tank summary', () => {
    const dive = new GarminDive(
      messages({ tankSummaryMesgs: [tankSummary(), tankSummary({ startPressure: 1 })] }),
    )

    expect(dive.startPressure?.bar).toBe(159.75)
  })

  it('yields undefined pressures when there is no tank summary', () => {
    const dive = new GarminDive(messages({ tankSummaryMesgs: [] }))

    expect(dive.startPressure).toBeUndefined()
    expect(dive.endPressure).toBeUndefined()
  })

  it('reads the sport, min and max temperature from the session', () => {
    const dive = new GarminDive(messages())

    expect(dive.sport).toBe('diving')
    expect(dive.minTemperature).toBe(22)
    expect(dive.maxTemperature).toBe(24)
  })

  it('returns empty first and last names', () => {
    const dive = new GarminDive(messages())

    expect(dive.firstName).toBe('')
    expect(dive.lastName).toBe('')
  })

  it('only reads the dive summary that references the session', () => {
    const dive = new GarminDive(
      messages({
        diveSummaryMesgs: [
          summary({ referenceMesg: 'lap', bottomTime: 60, maxDepth: 1 }),
          summary({ referenceMesg: 'session', bottomTime: 2074.407, maxDepth: 9.624 }),
        ],
      }),
    )

    expect(dive.diveTime).toBe(35)
    expect(dive.maxDepth).toBe(9.6)
  })

  it('yields undefined dive time and depth when the dive summary is missing', () => {
    const dive = new GarminDive(messages({ diveSummaryMesgs: [] }))

    expect(dive.diveTime).toBeUndefined()
    expect(dive.maxDepth).toBeUndefined()
    expect(dive.avgDepth).toBeUndefined()
  })

  it('yields undefined time and temperatures when the session is missing', () => {
    const dive = new GarminDive(messages({ sessionMesgs: [] }))

    expect(dive.startTime).toBeUndefined()
    expect(dive.minTemperature).toBeUndefined()
    expect(dive.maxTemperature).toBeUndefined()
  })

  it('throws when reading the sport without a session', () => {
    const dive = new GarminDive(messages({ sessionMesgs: [] }))

    expect(() => dive.sport).toThrow('No session data available')
  })

  describe('with the real Garmin Descent fixture', () => {
    const decodeFixture = (): GarminMessages => {
      const decoder = new Decoder(Stream.fromByteArray(garminDescentScubaFixture()))

      return decoder.read({ includeUnknownData: false, mergeHeartRates: true })
        .messages as GarminMessages
    }

    it('maps the decoded dive to the expected values', () => {
      const dive = new GarminDive(decodeFixture())

      expect(dive.diveTime).toBe(27)
      expect(dive.startTime).toEqual(new Date('2026-05-23T10:01:51.000Z'))
      expect(dive.maxDepth).toBe(9.2)
      expect(dive.avgDepth).toBe(3.8)
      expect(dive.sport).toBe('diving')
      expect(dive.minTemperature).toBe(11)
      expect(dive.maxTemperature).toBe(21)
    })

    it('reads the air-integration pressures the panel shows', () => {
      const dive = new GarminDive(decodeFixture())

      expect(dive.startPressure?.formatPsi()).toBe('2317 psi')
      expect(dive.startPressure?.formatBar()).toBe('159.8 bar')
      expect(dive.endPressure?.formatPsi()).toBe('1462 psi')
      expect(dive.endPressure?.formatBar()).toBe('100.8 bar')
    })
  })
})
