import { Decoder, Stream } from '@garmin-fit/sdk'
import { describe, expect, it } from 'vitest'
import { suuntoOceanScubaFixture } from './index'

describe('suunto ocean scuba fixture', () => {
  it('decodes as a valid FIT file with no errors', () => {
    const bytes = suuntoOceanScubaFixture()
    const decoder = new Decoder(Stream.fromByteArray(bytes))

    expect(decoder.isFIT(bytes)).toBe(true)
    expect(decoder.checkIntegrity()).toBe(true)

    const { messages, errors } = decoder.read({
      includeUnknownData: false,
      mergeHeartRates: true,
    })

    expect(errors).toHaveLength(0)
    expect(messages.fileIdMesgs[0].manufacturer).toBe('suunto')
    expect(messages.fileIdMesgs[0].productName).toBe('Suunto Ocean')
  })

  it('carries no position or personal-name fields', () => {
    const bytes = suuntoOceanScubaFixture()
    const decoder = new Decoder(Stream.fromByteArray(bytes))
    const { messages } = decoder.read({ includeUnknownData: false })

    const json = JSON.stringify(messages)
    expect(json).not.toMatch(/positionLat|positionLong/i)
    expect(json).not.toMatch(/firstName|lastName|userName/i)
  })
})
