import { Decoder, Stream } from '@garmin-fit/sdk'
import { garminDescentScubaFixture } from '@site/src/domain/diving/garmin/__fixtures__/index'
import { describe, expect, it } from 'vitest'
import { baseTypeSize, invalidBytesFor } from './baseTypes'
import { diveFixtureProfile } from './diveFixtureProfile'
import { fitCrc } from './fitCrc'
import { sanitiseFit } from './sanitiseFit'

const decode = (bytes: Uint8Array) =>
  new Decoder(Stream.fromByteArray(bytes)).read({ includeUnknownData: false }).messages

interface CraftOptions {
  withDeveloperFields?: boolean
  compressedTimestamp?: boolean
  bigEndian?: boolean
  headerSize?: 12 | 14
}

/**
 * Minimal FIT file: a header, one definition for the `record` message with a
 * single `positionLat` (sint32) field, one data message, then the file CRC.
 */
const craftFit = ({
  withDeveloperFields = false,
  compressedTimestamp = false,
  bigEndian = false,
  headerSize = 12,
}: CraftOptions = {}): Uint8Array => {
  const architecture = bigEndian ? 1 : 0
  const globalNum = bigEndian ? [0, 20] : [20, 0]
  const positionLat = [0, 4, 0x85]
  const definition = withDeveloperFields
    ? [0x60, 0, architecture, ...globalNum, 1, ...positionLat, 1, 0, 1, 0]
    : [0x40, 0, architecture, ...globalNum, 1, ...positionLat]
  // A compressed-timestamp header keeps the local message type in bits 5-6.
  const dataHeader = compressedTimestamp ? 0x80 : 0x00
  const data = withDeveloperFields ? [dataHeader, 1, 2, 3, 4, 7] : [dataHeader, 1, 2, 3, 4]
  const records = [...definition, ...data]

  const bytes = new Uint8Array(headerSize + records.length + 2)
  const view = new DataView(bytes.buffer)

  bytes.set([headerSize, 0x20, 0x00, 0x00], 0)
  view.setUint32(4, records.length, true)
  bytes.set([0x2e, 0x46, 0x49, 0x54], 8)
  bytes.set(records, headerSize)
  if (headerSize === 14) view.setUint16(12, fitCrc(bytes, 0, 12), true)
  view.setUint16(bytes.length - 2, fitCrc(bytes, 0, bytes.length - 2), true)

  return bytes
}

/** Recomputes the trailing CRC after a test has tampered with the bytes. */
const reseal = (bytes: Uint8Array): Uint8Array => {
  new DataView(bytes.buffer).setUint16(bytes.length - 2, fitCrc(bytes, 0, bytes.length - 2), true)

  return bytes
}

const keepRecords = { keep: ['record'], redact: [] }

describe('fitCrc', () => {
  it('reproduces the CRC stored at the end of a real FIT file', () => {
    const bytes = garminDescentScubaFixture()
    const stored = new DataView(bytes.buffer, bytes.byteOffset).getUint16(bytes.length - 2, true)

    expect(fitCrc(bytes, 0, bytes.length - 2)).toBe(stored)
  })

  it('is zero for an empty range', () => {
    expect(fitCrc(new Uint8Array([1, 2, 3]), 1, 1)).toBe(0)
  })
})

describe('invalidBytesFor', () => {
  it('returns the invalid pattern of the base type', () => {
    expect(invalidBytesFor(0x83, 2)).toEqual([0xff, 0x7f])
  })

  it('repeats the pattern across array fields', () => {
    expect(invalidBytesFor(0x84, 6)).toEqual([0xff, 0xff, 0xff, 0xff, 0xff, 0xff])
  })

  it('truncates a pattern that overshoots the field size', () => {
    expect(invalidBytesFor(0x86, 3)).toEqual([0xff, 0xff, 0xff])
  })

  it('falls back to a single invalid byte for unknown base types', () => {
    expect(invalidBytesFor(0x99, 2)).toEqual([0xff, 0xff])
  })

  it('reports the element width of a base type, falling back to one byte', () => {
    expect(baseTypeSize(0x85)).toBe(4)
    expect(baseTypeSize(0x99)).toBe(1)
  })
})

describe('sanitiseFit', () => {
  it('keeps only the requested messages', () => {
    const result = sanitiseFit(garminDescentScubaFixture(), { keep: ['fileId'], redact: [] })
    const messages = decode(result)

    expect(messages.fileIdMesgs).toHaveLength(1)
    expect(messages.sessionMesgs ?? []).toHaveLength(0)
    expect(messages.recordMesgs ?? []).toHaveLength(0)
  })

  it('blanks redacted fields but keeps the rest of the message', () => {
    const result = sanitiseFit(garminDescentScubaFixture(), {
      keep: ['fileId'],
      redact: ['product'],
    })
    const fileId = decode(result).fileIdMesgs[0]

    expect(fileId.product).toBeUndefined()
    expect(fileId.garminProduct).toBeUndefined()
    expect(fileId.manufacturer).toBe('garmin')
  })

  it('produces a file that still passes the FIT integrity check', () => {
    const result = sanitiseFit(garminDescentScubaFixture(), { keep: ['fileId'], redact: [] })
    const decoder = new Decoder(Stream.fromByteArray(result))

    expect(decoder.isFIT(result)).toBe(true)
    expect(decoder.checkIntegrity()).toBe(true)
  })

  it('rewrites the data size to match what it kept', () => {
    const result = sanitiseFit(garminDescentScubaFixture(), { keep: [], redact: [] })
    const dataSize = new DataView(result.buffer).getUint32(4, true)

    expect(dataSize).toBe(result.length - result[0] - 2)
  })

  it('keeps files whose header carries no CRC', () => {
    const crafted = craftFit()

    expect(sanitiseFit(crafted, keepRecords)).toEqual(crafted)
  })

  it('leaves no personal data behind when run with the dive fixture profile', () => {
    const json = JSON.stringify(
      decode(sanitiseFit(garminDescentScubaFixture(), diveFixtureProfile)),
    )

    // Match field names only: `"...":`, so values such as "flat24Hours" that
    // happen to contain "lat" do not trip the assertion.
    expect(json).not.toMatch(/"[^"]*(lat|long|serial|heartrate|sensor)[^"]*"\s*:/i)
    expect(json).toMatch(/startPressure/)
  })

  describe('redaction', () => {
    const positionOf = (bytes: Uint8Array): number[] => Array.from(bytes.slice(-6, -2))

    it('writes little-endian invalid values for little-endian definitions', () => {
      const result = sanitiseFit(craftFit(), { keep: ['record'], redact: ['positionLat'] })

      expect(positionOf(result)).toEqual([0xff, 0xff, 0xff, 0x7f])
    })

    it('writes big-endian invalid values for big-endian definitions', () => {
      const result = sanitiseFit(craftFit({ bigEndian: true }), {
        keep: ['record'],
        redact: ['positionLat'],
      })

      expect(positionOf(result)).toEqual([0x7f, 0xff, 0xff, 0xff])
    })

    it('drops the whole message when it is not in the keep list', () => {
      expect(sanitiseFit(craftFit(), { keep: [], redact: [] })).toHaveLength(craftFit().length - 5)
    })
  })

  describe('developer fields', () => {
    it('drops them, since their contents cannot be classified', () => {
      const result = sanitiseFit(craftFit({ withDeveloperFields: true }), keepRecords)

      // Same output as a file that never had developer fields.
      expect(result).toEqual(craftFit())
    })

    it('still drops the message itself when it is not kept', () => {
      const result = sanitiseFit(craftFit({ withDeveloperFields: true }), { keep: [], redact: [] })

      expect(decode(result).recordMesgs ?? []).toHaveLength(0)
    })
  })

  describe('rejected input', () => {
    it('refuses compressed timestamp records, which the FIT SDK cannot read', () => {
      expect(() => sanitiseFit(craftFit({ compressedTimestamp: true }), keepRecords)).toThrow(
        'Compressed timestamp messages are not supported',
      )
    })

    it('refuses a buffer too small to hold a header', () => {
      expect(() => sanitiseFit(new Uint8Array([12, 0x20]), keepRecords)).toThrow('too short')
    })

    it('refuses a definition that runs past the end of the data', () => {
      const full = craftFit()
      // Cut the file mid-definition, then re-declare the shorter data section.
      const cutOff = new Uint8Array(12 + 4 + 2)
      cutOff.set(full.slice(0, 12 + 4))
      new DataView(cutOff.buffer).setUint32(4, 4, true)

      expect(() => sanitiseFit(reseal(cutOff), keepRecords)).toThrow(
        'definition runs past the data',
      )
    })

    it('refuses a file without the FIT signature', () => {
      const notFit = craftFit()
      notFit.set([0x2e, 0x46, 0x49, 0x55], 8)

      expect(() => sanitiseFit(reseal(notFit), keepRecords)).toThrow('Not a FIT file')
    })

    it('refuses an unsupported header size', () => {
      const oddHeader = craftFit()
      oddHeader[0] = 13

      expect(() => sanitiseFit(reseal(oddHeader), keepRecords)).toThrow('Unsupported FIT header')
    })

    it('refuses a file whose declared data size overruns the buffer', () => {
      const truncated = craftFit()
      new DataView(truncated.buffer).setUint32(4, 9_000, true)

      expect(() => sanitiseFit(reseal(truncated), keepRecords)).toThrow('truncated')
    })

    it('refuses a file whose CRC does not match', () => {
      const corrupt = craftFit()
      corrupt[corrupt.length - 1] ^= 0xff

      expect(() => sanitiseFit(corrupt, keepRecords)).toThrow('file CRC')
    })

    it('refuses a file whose header CRC does not match', () => {
      const corrupt = craftFit({ headerSize: 14 })
      corrupt[12] ^= 0xff

      expect(() => sanitiseFit(reseal(corrupt), keepRecords)).toThrow('header CRC')
    })

    it('accepts a 14-byte header with a valid CRC', () => {
      const crafted = craftFit({ headerSize: 14 })

      expect(sanitiseFit(crafted, keepRecords)).toEqual(crafted)
    })

    it('accepts a 14-byte header that leaves the CRC field zeroed', () => {
      const crafted = craftFit({ headerSize: 14 })
      new DataView(crafted.buffer).setUint16(12, 0, true)

      expect(sanitiseFit(reseal(crafted), keepRecords)).toHaveLength(crafted.length)
    })

    it('refuses a data message that has no definition', () => {
      const orphan = new Uint8Array([
        12, 0x20, 0, 0, 1, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54, 0x00, 0, 0,
      ])

      expect(() => sanitiseFit(reseal(orphan), keepRecords)).toThrow(
        'Data message without definition',
      )
    })

    it('refuses a record that runs past the end of the data section', () => {
      const full = craftFit()
      // Keep the definition whole but cut the data message body short.
      const cutOff = new Uint8Array(full.length - 2)
      cutOff.set(full.slice(0, full.length - 4))
      new DataView(cutOff.buffer).setUint32(4, cutOff.length - 12 - 2, true)

      expect(() => sanitiseFit(reseal(cutOff), keepRecords)).toThrow('record runs past the data')
    })
  })

  it('names messages the profile does not know', () => {
    const unknown = craftFit()
    // Global message number 64_000 is not in the FIT profile. It sits two bytes
    // into the definition body: 12 header, 1 record header, reserved, arch.
    new DataView(unknown.buffer).setUint16(15, 64_000, true)

    expect(sanitiseFit(reseal(unknown), { keep: ['unknown_64000'], redact: [] })).toHaveLength(
      unknown.length,
    )
  })
})
