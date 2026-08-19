import { Profile } from '@garmin-fit/sdk'
import { invalidBytesFor } from './baseTypes'
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
  bodySize: number
}

export interface SanitiseOptions {
  /** Message names to keep; every other data message is dropped. */
  keep: string[]
  /** Field names whose values are overwritten with the FIT "invalid" pattern. */
  redact: string[]
}

const messageName = (globalNum: number): string =>
  Profile.messages[globalNum]?.name ?? `unknown_${globalNum}`

const fieldName = (globalNum: number, fieldNum: number): string =>
  Profile.messages[globalNum]?.fields?.[fieldNum]?.name ?? `unknown_${fieldNum}`

/** Reads a definition message body, starting just after the record header. */
const readDefinition = (bytes: Uint8Array, start: number, hasDevFields: boolean) => {
  const littleEndian = bytes[start + 1] === 0
  const view = new DataView(bytes.buffer, bytes.byteOffset)
  const globalNum = view.getUint16(start + 2, littleEndian)
  const fieldCount = bytes[start + 4]

  const fields: FieldDefinition[] = []
  let cursor = start + 5
  let offset = 0

  for (let index = 0; index < fieldCount; index += 1) {
    const [fieldNum, size, baseType] = [bytes[cursor], bytes[cursor + 1], bytes[cursor + 2]]
    fields.push({ fieldNum, size, baseType, offset })
    offset += size
    cursor += 3
  }

  if (hasDevFields) {
    const devFieldCount = bytes[cursor]
    cursor += 1
    for (let index = 0; index < devFieldCount; index += 1) {
      offset += bytes[cursor + 1]
      cursor += 3
    }
  }

  return { definition: { globalNum, fields, bodySize: offset }, end: cursor }
}

/**
 * Rewrites a FIT file so it carries only the messages a fixture needs, with
 * sensitive fields blanked to the protocol's "invalid" value. The result is a
 * structurally valid FIT file: definitions, record order and CRCs all hold, so
 * the Garmin SDK decodes it exactly like the original minus the removed data.
 */
export const sanitiseFit = (bytes: Uint8Array, options: SanitiseOptions): Uint8Array => {
  const keep = new Set(options.keep)
  const redact = new Set(options.redact)

  const headerSize = bytes[0]
  const view = new DataView(bytes.buffer, bytes.byteOffset)
  const dataSize = view.getUint32(4, true)
  const dataEnd = headerSize + dataSize

  const definitions = new Map<number, MessageDefinition>()
  const kept: number[] = []

  let cursor = headerSize
  while (cursor < dataEnd) {
    const recordHeader = bytes[cursor]
    const isCompressedTimestamp = (recordHeader & 0x80) !== 0
    const localType = isCompressedTimestamp ? (recordHeader >> 5) & 0x03 : recordHeader & 0x0f

    if (!isCompressedTimestamp && (recordHeader & 0x40) !== 0) {
      const { definition, end } = readDefinition(bytes, cursor + 1, (recordHeader & 0x20) !== 0)
      definitions.set(localType, definition)
      // Definitions carry no dive data, so they always survive.
      for (let index = cursor; index < end; index += 1) kept.push(bytes[index])
      cursor = end
      continue
    }

    const definition = definitions.get(localType)
    if (!definition) throw new Error(`Data message without definition (local type ${localType})`)

    const bodyStart = cursor + 1
    const recordEnd = bodyStart + definition.bodySize
    const name = messageName(definition.globalNum)

    if (keep.has(name)) {
      const record = Array.from(bytes.slice(cursor, recordEnd))

      for (const field of definition.fields) {
        if (!redact.has(fieldName(definition.globalNum, field.fieldNum))) continue

        const invalid = invalidBytesFor(field.baseType, field.size)
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
