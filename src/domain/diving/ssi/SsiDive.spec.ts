import { describe, expect, it } from 'vitest'
import { GarminDive } from '../garmin/GarminDive'
import type { DiveSummary, GarminMessages, GarminSession } from '../garmin/GarminMessages'
import { SsiDive } from './SsiDive'

// Local-time Date so `formatDate` (which reads local calendar fields) is
// deterministic regardless of the machine timezone.
const startTime = new Date(2023, 8, 15, 17, 57, 17)

const garminMessages = (): GarminMessages =>
  ({
    sessionMesgs: [
      {
        startTime,
        sport: 'diving',
        subSport: 'singleGasDiving',
        avgTemperature: 23,
        maxTemperature: 24,
        minTemperature: 22,
      } as GarminSession,
    ],
    diveSummaryMesgs: [
      { referenceMesg: 'session', bottomTime: 2074.407, maxDepth: 9.624 } as DiveSummary,
    ],
  }) as GarminMessages

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

describe('SsiDive.fromGarmin', () => {
  it('produces the expected QR payload for a complete Garmin dive', () => {
    const dive = SsiDive.fromGarmin(new GarminDive(garminMessages()))

    expect(SsiDive.toQR(dive)).toBe(
      'dive;noid;dive_type:0;divetime:35;datetime:202309151757;depth_m:9.6;' +
        'user_firstname:;user_lastname:;watertemp_c:22;watertemp_max_c:24',
    )
  })
})
