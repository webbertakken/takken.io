import { describe, expect, it } from 'vitest'
import { SsiDive } from './SsiDive'

describe('SsiDive.toQR', () => {
  it('renders key/value pairs joined by semicolons', () => {
    const qr = SsiDive.toQR({ divetime: 51, depth_m: 11.9 })

    expect(qr).toBe('divetime:51;depth_m:11.9')
  })

  it('renders null values as a bare key', () => {
    const qr = SsiDive.toQR({ dive: null, noid: null })

    expect(qr).toBe('dive;noid')
  })

  it('omits undefined values entirely rather than emitting key:undefined', () => {
    const qr = SsiDive.toQR({
      dive: null,
      divetime: undefined,
      depth_m: 11.9,
      watertemp_c: undefined,
    })

    expect(qr).toBe('dive;depth_m:11.9')
    expect(qr).not.toMatch(/undefined/)
  })
})
