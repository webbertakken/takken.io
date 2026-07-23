import { describe, expect, it } from 'vitest'
import { GarminDive } from './GarminDive'
import type { DiveSummary, GarminMessages, GarminSession } from './GarminMessages'

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
    ...overrides,
  }) as DiveSummary

const messages = (overrides: Partial<GarminMessages> = {}): GarminMessages =>
  ({
    sessionMesgs: [session()],
    diveSummaryMesgs: [summary()],
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
})
