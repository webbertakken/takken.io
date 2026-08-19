import { Decoder, Stream } from '@garmin-fit/sdk'
import { garminDescentScubaFixture } from '@site/src/domain/diving/garmin/__fixtures__/index'
import { describe, expect, it } from 'vitest'
import { invalidBytesFor } from './baseTypes'
import { diveFixtureProfile } from './diveFixtureProfile'
import { fitCrc } from './fitCrc'
import { sanitiseFit } from './sanitiseFit'

const decode = (bytes: Uint8Array) =>
  new Decoder(Stream.fromByteArray(bytes)).read({ includeUnknownData: false }).messages

/**
 * Minimal FIT file: a 12-byte header (no header CRC), one definition message
 * and one data message, then the file CRC.
 */
const craftFit = ({
  withDeveloperFields = false,
  compressedTimestamp = false,
} = {}): Uint8Array => {
  const definition = withDeveloperFields
    ? [0x60, 0, 0, 20, 0, 1, 0, 1, 0x02, 1, 0, 1, 0]
    : [0x40, 0, 0, 20, 0, 1, 0, 1, 0x02]
  // A compressed-timestamp header keeps the local message type in bits 5-6.
  const dataHeader = compressedTimestamp ? 0x80 : 0x00
  const data = withDeveloperFields ? [dataHeader, 42, 7] : [dataHeader, 42]
  const records = [...definition, ...data]

  const bytes = new Uint8Array(12 + records.length + 2)
  bytes.set([12, 0x20, 0x00, 0x00], 0)
  new DataView(bytes.buffer).setUint32(4, records.length, true)
  bytes.set([0x2e, 0x46, 0x49, 0x54], 8)
  bytes.set(records, 12)
  new DataView(bytes.buffer).setUint16(bytes.length - 2, fitCrc(bytes, 0, bytes.length - 2), true)

  return bytes
}

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
    const result = sanitiseFit(craftFit(), { keep: ['record'], redact: [] })

    expect(result[0]).toBe(12)
    expect(Array.from(result.slice(12))).toEqual([
      0x40,
      0,
      0,
      20,
      0,
      1,
      0,
      1,
      0x02,
      0x00,
      42,
      ...Array.from(result.slice(-2)),
    ])
  })

  it('accounts for developer fields when sizing a data message', () => {
    const withDev = craftFit({ withDeveloperFields: true })

    expect(sanitiseFit(withDev, { keep: ['record'], redact: [] })).toEqual(withDev)
    expect(sanitiseFit(withDev, { keep: [], redact: [] })).toHaveLength(withDev.length - 3)
  })

  it('reads data messages that use a compressed timestamp header', () => {
    const compressed = craftFit({ compressedTimestamp: true })

    expect(sanitiseFit(compressed, { keep: ['record'], redact: [] })).toEqual(compressed)
    expect(sanitiseFit(compressed, { keep: [], redact: [] })).toHaveLength(compressed.length - 2)
  })

  it('names messages the profile does not know', () => {
    const unknown = craftFit()
    // Global message number 64_000 is not in the FIT profile. It sits two bytes
    // into the definition body: 12 header, 1 record header, reserved, arch.
    new DataView(unknown.buffer).setUint16(15, 64_000, true)
    new DataView(unknown.buffer).setUint16(
      unknown.length - 2,
      fitCrc(unknown, 0, unknown.length - 2),
      true,
    )

    expect(sanitiseFit(unknown, { keep: ['unknown_64000'], redact: [] })).toHaveLength(
      unknown.length,
    )
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

  it('throws on a data message that has no definition', () => {
    const orphan = new Uint8Array([12, 0x20, 0, 0, 1, 0, 0, 0, 0x2e, 0x46, 0x49, 0x54, 0x00, 0, 0])

    expect(() => sanitiseFit(orphan, { keep: [], redact: [] })).toThrow(
      'Data message without definition',
    )
  })
})
