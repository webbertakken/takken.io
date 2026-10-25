import { describe, expect, it } from 'vitest'
import type { FitMessages } from './FitMessages'
import { detectVendor } from './FitVendor'

const withManufacturer = (manufacturer: unknown): FitMessages => ({
  fileIdMesgs: [{ manufacturer }],
})

describe('detectVendor', () => {
  it('detects Garmin files', () => {
    expect(detectVendor(withManufacturer('garmin'))).toBe('garmin')
  })

  it('detects Suunto files', () => {
    expect(detectVendor(withManufacturer('suunto'))).toBe('suunto')
  })

  it('returns unknown for other manufacturers', () => {
    expect(detectVendor(withManufacturer('shearwater'))).toBe('unknown')
  })

  it('returns unknown when the manufacturer is absent', () => {
    expect(detectVendor({ fileIdMesgs: [{}] })).toBe('unknown')
    expect(detectVendor({ fileIdMesgs: [] })).toBe('unknown')
    expect(detectVendor({})).toBe('unknown')
  })
})
