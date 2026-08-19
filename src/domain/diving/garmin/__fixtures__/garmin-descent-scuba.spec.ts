import { Decoder, Stream } from '@garmin-fit/sdk'
import type { GarminMessages } from '@site/src/domain/diving/garmin/GarminMessages'
import { describe, expect, it } from 'vitest'
import { garminDescentScubaFixture } from './index'

// `checkIntegrity` consumes the stream, so it only holds on an unread decoder.
const decode = () => {
  const bytes = garminDescentScubaFixture()
  const decoder = new Decoder(Stream.fromByteArray(bytes))

  const { messages, errors } = decoder.read({ includeUnknownData: false, mergeHeartRates: true })

  return { bytes, messages: messages as GarminMessages, errors: errors as unknown[] }
}

describe('garmin descent scuba fixture', () => {
  it('decodes as a valid FIT file with no errors', () => {
    const bytes = garminDescentScubaFixture()
    const decoder = new Decoder(Stream.fromByteArray(bytes))

    expect(decoder.isFIT(bytes)).toBe(true)
    expect(decoder.checkIntegrity()).toBe(true)

    const { messages, errors } = decode()

    expect(errors).toHaveLength(0)
    expect(messages.fileIdMesgs[0].manufacturer).toBe('garmin')
    expect(messages.fileIdMesgs[0].garminProduct).toBe('descentMk2')
  })

  it('carries no position, identity or biometric fields', () => {
    const json = JSON.stringify(decode().messages)

    expect(json).not.toMatch(/positionLat|positionLong|necLat|necLong|swcLat|swcLong/i)
    expect(json).not.toMatch(/firstName|lastName|userName/i)
    expect(json).not.toMatch(/serialNumber|"sensor"|antDeviceNumber/i)
    expect(json).not.toMatch(/heartRate/i)
  })

  it('drops the user profile, device info and gps metadata entirely', () => {
    const { messages } = decode()

    expect(messages.userProfileMesgs ?? []).toHaveLength(0)
    expect(messages.deviceInfoMesgs ?? []).toHaveLength(0)
    expect(messages.gpsMetadataMesgs ?? []).toHaveLength(0)
  })

  it('keeps the dive data the tool relies on', () => {
    const { messages } = decode()
    const summary = messages.diveSummaryMesgs?.find(
      (message) => message.referenceMesg === 'session',
    )

    expect(messages.sessionMesgs[0].sport).toBe('diving')
    expect(summary?.avgDepth).toBe(3.809)
    expect(summary?.maxDepth).toBe(9.202)
    expect(messages.tankSummaryMesgs?.[0].startPressure).toBe(159.75)
    expect(messages.tankSummaryMesgs?.[0].endPressure).toBe(100.8)
  })
})
