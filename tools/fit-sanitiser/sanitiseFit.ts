import { Profile } from '@garmin-fit/sdk'
import { baseTypeSize, invalidBytesFor } from './baseTypes'
import { fitCrc } from './fitCrc'

interface FieldDefinition {
  fieldNum: number
  size: number
  baseType: number
  /** Offset of this field within the data message body. */
  offset: number
}

interface MessageDefinition {
  globalNum: number
  fields: FieldDefinition[]
  /** Body size of the native fields, which is all this tool keeps. */
  nativeSize: number
  /** Body size of the developer fields that follow the native ones. */
  developerSize: number
  littleEndian: boolean
}

export interface SanitiseOptions {
  /** Message names to keep; every other data message is dropped. */
  keep: string[]
  /** Field names whose values are overwritten with the FIT "invalid" pattern. */
  redact: string[]
}

const FIT_SIGNATURE = '.FIT'

const messageName = (globalNum: number): string =>
  Profile.messages[globalNum]?.name ?? `unknown_${globalNum}`

const fieldName = (globalNum: number, fieldNum: number): string =>
  Profile.messages[globalNum]?.fields?.[fieldNum]?.name ?? `unknown_${fieldNum}`

/**
 * Validates the file header and the trailing CRC. A sanitiser that re-seals
 * whatever it is given would happily turn unreadable input into a file that
 * looks valid, so anything malformed is rejected up front.
 */
const readHeader = (bytes: Uint8Array) => {
  if (bytes.length < 14) throw new Error('Not a FIT file: too short')

  const headerSize = bytes[0]
  if (headerSize !== 12 && headerSize !== 14) {
    throw new Error(`Unsupported FIT header size ${headerSize}`)
  }

  const signature = String.fromCharCode(...bytes.slice(8, 12))
  if (signature !== FIT_SIGNATURE) throw new Error('Not a FIT file: missing .FIT signature')

  const view = new DataView(bytes.buffer, bytes.byteOffset)
  const dataEnd = headerSize + view.getUint32(4, true)
  if (dataEnd + 2 !== bytes.length) throw new Error('FIT file is truncated or has trailing data')

  // A zeroed header CRC means "not present", which the protocol allows.
  const headerCrc = headerSize === 14 ? view.getUint16(12, true) : 0
  if (headerCrc !== 0 && headerCrc !== fitCrc(bytes, 0, 12)) {
    throw new Error('FIT header CRC does not match')
  }

  if (view.getUint16(dataEnd, true) !== fitCrc(bytes, 0, dataEnd)) {
    throw new Error('FIT file CRC does not match')
  }

  return { headerSize, dataEnd }
}

/** Reads a definition message body, starting just after the record header. */
const readDefinition = (bytes: Uint8Array, start: number, hasDevFields: boolean) => {
  const littleEndian = bytes[start + 1] === 0
  const view = new DataView(bytes.buffer, bytes.byteOffset)
  const globalNum = view.getUint16(start + 2, littleEndian)
  const fieldCount = bytes[start + 4]

  const fields: FieldDefinition[] = []
  let cursor = start + 5
  let nativeSize = 0

  for (let index = 0; index < fieldCount; index += 1) {
    const [fieldNum, size, baseType] = [bytes[cursor], bytes[cursor + 1], bytes[cursor + 2]]
    fields.push({ fieldNum, size, baseType, offset: nativeSize })
    nativeSize += size
    cursor += 3
  }

  const nativeEnd = cursor
  let developerSize = 0

  if (hasDevFields) {
    const devFieldCount = bytes[cursor]
    cursor += 1
    for (let index = 0; index < devFieldCount; index += 1) {
      developerSize += bytes[cursor + 1]
      cursor += 3
    }
  }

  return {
    definition: { globalNum, fields, nativeSize, developerSize, littleEndian },
    nativeEnd,
    end: cursor,
  }
}

/** The invalid pattern for a field, in the byte order its definition declared. */
const invalidValueFor = (field: FieldDefinition, littleEndian: boolean): number[] => {
  const bytes = invalidBytesFor(field.baseType, field.size)
  if (littleEndian) return bytes

  const elementSize = baseTypeSize(field.baseType)
  const reversed: number[] = []

  for (let index = 0; index < bytes.length; index += elementSize) {
    reversed.push(...bytes.slice(index, index + elementSize).reverse())
  }

  return reversed
}

/**
 * Rewrites a FIT file so it carries only the messages a fixture needs, with
 * sensitive fields blanked to the protocol's "invalid" value. Developer fields
 * are dropped wholesale: their contents are vendor defined, so they cannot be
 * classified as safe. The result is a structurally valid FIT file that the
 * Garmin SDK decodes exactly like the original minus the removed data.
 */
export const sanitiseFit = (bytes: Uint8Array, options: SanitiseOptions): Uint8Array => {
  const keep = new Set(options.keep)
  const redact = new Set(options.redact)
  const { headerSize, dataEnd } = readHeader(bytes)

  const definitions = new Map<number, MessageDefinition>()
  const kept: number[] = []

  let cursor = headerSize
  while (cursor < dataEnd) {
    const recordHeader = bytes[cursor]

    if ((recordHeader & 0x80) !== 0) {
      // The FIT SDK refuses these too, so a fixture must not contain them.
      throw new Error('Compressed timestamp messages are not supported')
    }

    const localType = recordHeader & 0x0f

    if ((recordHeader & 0x40) !== 0) {
      const hasDevFields = (recordHeader & 0x20) !== 0
      const { definition, nativeEnd, end } = readDefinition(bytes, cursor + 1, hasDevFields)
      if (end > dataEnd) throw new Error('FIT file is truncated: definition runs past the data')

      definitions.set(localType, definition)
      // Re-emit without the developer section, clearing its header bit.
      kept.push(recordHeader & ~0x20)
      for (let index = cursor + 1; index < nativeEnd; index += 1) kept.push(bytes[index])
      cursor = end
      continue
    }

    const definition = definitions.get(localType)
    if (!definition) throw new Error(`Data message without definition (local type ${localType})`)

    const bodyStart = cursor + 1
    const recordEnd = bodyStart + definition.nativeSize + definition.developerSize
    if (recordEnd > dataEnd) throw new Error('FIT file is truncated: record runs past the data')

    if (keep.has(messageName(definition.globalNum))) {
      // Developer field bytes sit after the native ones, so they fall away here.
      const record = Array.from(bytes.slice(cursor, bodyStart + definition.nativeSize))

      for (const field of definition.fields) {
        if (!redact.has(fieldName(definition.globalNum, field.fieldNum))) continue

        const invalid = invalidValueFor(field, definition.littleEndian)
        // +1 skips the record header that `record` starts with.
        invalid.forEach((byte, index) => (record[1 + field.offset + index] = byte))
      }

      kept.push(...record)
    }

    cursor = recordEnd
  }

  const result = new Uint8Array(headerSize + kept.length + 2)
  result.set(bytes.slice(0, headerSize))
  result.set(kept, headerSize)

  const resultView = new DataView(result.buffer)
  resultView.setUint32(4, kept.length, true)
  if (headerSize === 14) resultView.setUint16(12, fitCrc(result, 0, 12), true)
  resultView.setUint16(result.length - 2, fitCrc(result, 0, result.length - 2), true)

  return result
}
