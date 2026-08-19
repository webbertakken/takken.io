/**
 * FIT base types, keyed by the base-type byte found in a definition message.
 * `invalid` holds the little-endian byte pattern the FIT protocol reserves for
 * "no value"; writing it over a field makes decoders omit that field entirely.
 */
interface BaseType {
  size: number
  invalid: number[]
}

const baseTypes = new Map<number, BaseType>([
  [0x00, { size: 1, invalid: [0xff] }], // enum
  [0x01, { size: 1, invalid: [0x7f] }], // sint8
  [0x02, { size: 1, invalid: [0xff] }], // uint8
  [0x83, { size: 2, invalid: [0xff, 0x7f] }], // sint16
  [0x84, { size: 2, invalid: [0xff, 0xff] }], // uint16
  [0x85, { size: 4, invalid: [0xff, 0xff, 0xff, 0x7f] }], // sint32
  [0x86, { size: 4, invalid: [0xff, 0xff, 0xff, 0xff] }], // uint32
  [0x07, { size: 1, invalid: [0x00] }], // string
  [0x88, { size: 4, invalid: [0xff, 0xff, 0xff, 0xff] }], // float32
  [0x89, { size: 8, invalid: [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff] }], // float64
  [0x0a, { size: 1, invalid: [0x00] }], // uint8z
  [0x8b, { size: 2, invalid: [0x00, 0x00] }], // uint16z
  [0x8c, { size: 4, invalid: [0x00, 0x00, 0x00, 0x00] }], // uint32z
  [0x0d, { size: 1, invalid: [0xff] }], // byte
  [0x8e, { size: 8, invalid: [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f] }], // sint64
  [0x8f, { size: 8, invalid: [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff] }], // uint64
  [0x90, { size: 8, invalid: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00] }], // uint64z
])

const fallback: BaseType = { size: 1, invalid: [0xff] }

/** Width of one element of the base type, in bytes. */
export const baseTypeSize = (baseTypeByte: number): number =>
  (baseTypes.get(baseTypeByte) ?? fallback).size

/**
 * Byte pattern that marks `size` bytes of the given base type as absent, in
 * little-endian order (the order the FIT profile documents them in).
 */
export const invalidBytesFor = (baseTypeByte: number, size: number): number[] => {
  const baseType = baseTypes.get(baseTypeByte) ?? fallback
  const pattern: number[] = []

  while (pattern.length < size) pattern.push(...baseType.invalid)

  return pattern.slice(0, size)
}
