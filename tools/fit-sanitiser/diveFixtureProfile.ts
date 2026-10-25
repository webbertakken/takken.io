import type { SanitiseOptions } from './sanitiseFit'

/**
 * What a committed dive fixture may contain. Everything outside `keep` is
 * dropped wholesale (GPS metadata, user profile, device info, HR zones), and
 * every field in `redact` is blanked in the messages that survive.
 */
export const diveFixtureProfile: SanitiseOptions = {
  keep: [
    'fileId',
    'fileCreator',
    'sport',
    'diveSettings',
    'diveGas',
    'diveSummary',
    'session',
    'lap',
    'record',
    'tankUpdate',
    'tankSummary',
    'activity',
  ],
  redact: [
    'serialNumber',
    'sensor',
    'antDeviceNumber',
    'positionLat',
    'positionLong',
    'startPositionLat',
    'startPositionLong',
    'endPositionLat',
    'endPositionLong',
    'necLat',
    'necLong',
    'swcLat',
    'swcLong',
    'heartRate',
    'avgHeartRate',
    'maxHeartRate',
    'minHeartRate',
    'heartRateSource',
    'heartRateSourceType',
    'heartRateLocalDeviceType',
    'totalCalories',
    'sportProfileName',
    'diveNumber',
  ],
}
