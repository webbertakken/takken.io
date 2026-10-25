const CRC_TABLE = [
  0x0000, 0xcc01, 0xd801, 0x1400, 0xf001, 0x3c00, 0x2800, 0xe401, 0xa001, 0x6c00, 0x7800, 0xb401,
  0x5000, 0x9c01, 0x8801, 0x4400,
]

/**
 * FIT protocol CRC-16, as described in the FIT SDK. Computed over a byte range
 * and stored little-endian at the end of the file (and in the file header).
 */
export const fitCrc = (bytes: Uint8Array, start = 0, end = bytes.length): number => {
  let crc = 0

  for (let index = start; index < end; index += 1) {
    const byte = bytes[index]

    let tmp = CRC_TABLE[crc & 0xf]
    crc = (crc >> 4) & 0x0fff
    crc = crc ^ tmp ^ CRC_TABLE[byte & 0xf]

    tmp = CRC_TABLE[crc & 0xf]
    crc = (crc >> 4) & 0x0fff
    crc = crc ^ tmp ^ CRC_TABLE[(byte >> 4) & 0xf]
  }

  return crc
}
