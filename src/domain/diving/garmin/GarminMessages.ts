export interface GarminMessages {
  fileIdMesgs: { timeCreated: Date }[]
  sportMesgs: GarminSport[]
  diveSettingsMesgs: GarminDiveSettings[]
  diveGasMesgs: GarminDiveGas[]
  sessionMesgs: GarminSession[]
  diveSummaryMesgs: DiveSummary[]
}

export interface GarminSport {
  name: string
  sport: 'diving'
  subSport: 'singleGasDiving' | string
}

export interface GarminDiveSettings {
  waterDensity: number // 1000
  bottomDepth: null // null
  apneaCountdownTime: number // 120
  ccrLowSetpointDepth: number // 4.572
  ccrHighSetpointDepth: number // 21.336
  messageIndex: number // 0
  repeatDiveInterval: number // 60
  safetyStopTime: number // 180
  travelGas: number // 0
  model: string // 'zhl16c'
  gfLow: number // 35
  gfHigh: number // 75
  waterType: string // 'fresh'
  po2Warn: number // 1.4
  po2Critical: number // 1.6
  po2Deco: number // 1.4
  safetyStopEnabled: number // 1
  apneaCountdownEnabled: number // 0
  backlightMode: string // 'atDepth'
  backlightBrightness: number // 30
  backlightTimeout: number // 8
  heartRateSourceType: string // 'local'
  heartRateSource: number // 10
  ccrLowSetpointSwitchMode: string // 'manual'
  ccrLowSetpoint: number // 0.7
  ccrHighSetpointSwitchMode: string // 'manual'
  ccrHighSetpoint: number // 1.3
  gasConsumptionDisplay: string // 'pressureSac'
  upKeyEnabled: number // 0
  diveSounds: string // 'toneAndVibrate'
  lastStopMultiple: number // 1
  noFlyTimeMode: string // 'standard'
  heartRateLocalDeviceType: string // 'whr'
}

export interface GarminDiveGas {}

export interface GarminSession {
  timestamp: Date // "2023-09-15T18:32:52.000Z",
  startTime: Date // "2023-09-15T17:57:17.000Z",
  startPositionLat: number // 623238215,
  startPositionLong: number // 81525677,
  totalElapsedTime: number // 2134.666,
  totalTimerTime: number // 2134.666,
  totalDistance: number // 0,
  totalCycles: number // 8,
  endPositionLat: number // 623242143,
  endPositionLong: number // 81536643,
  sportProfileName: string // "Single-Gas",
  enhancedAvgSpeed: number // 0,
  trainingLoadPeak: number // 5.9051055908203125,
  totalGrit: null // null,
  avgFlow: null // null,
  messageIndex: number // 0,
  totalCalories: number // 219,
  avgSpeed: number // 65.535,
  maxSpeed: number // 65.535,
  totalAscent: number // 0,
  totalDescent: number // 0,
  firstLapIndex: number // 0,
  numLaps: number // 1,
  event: string // "lap",
  eventType: string // "stop",
  sport: GarminSport['sport'] // "diving",
  subSport: GarminSport['subSport'] // "singleGasDiving",
  avgHeartRate: number // 99,
  maxHeartRate: number // 119,
  trigger: string // "activityEnd",
  avgTemperature: number // 23,
  maxTemperature: number // 24,
  minTemperature: number // 22,
  totalFractionalAscent: number // 0,
  totalFractionalDescent: number // 0
}

export interface DiveSummary {
  timestamp: Date // "2023-09-15T18:32:52.000Z",
  avgDepth: number // 6.222,
  maxDepth: number // 9.624,
  diveNumber: number // 7,
  bottomTime: number // 2074.407,
  descentTime: number // 937,
  ascentTime: number // 2880188.287,
  avgAscentRate: number // 0.07,
  referenceMesg: 'session' | 'lap' | string // "session",
  referenceIndex: number // 0,
  startN2: number // 1,
  endN2: number // 33,
  o2Toxicity: number // 0,
  avgPressureSac: number // 2.9,
  startCns: number // 0,
  endCns: number // 0
}
