export enum SsiDecompression {
  No = 0,
  Yes = 1,
}

export enum SsiDiveType {
  Scuba = 0,
  ExtendedRange = 1, // Todo - confirm
  Freediving = 2, // Todo - confirm
  Rebreather = 3, // Todo - confirm
}

export type SsiDiveSite = number // 12345
export enum SsiWeather {
  Cloudless = 1,
}

export enum SsiWaterEntry {
  ShoreOrBeach = 21,
}

export enum SsiBodyOfWater {
  OpenWater = 54,
}

export enum SsiWaterType {
  SaltWater = 5,
}

export enum SsiCurrent {
  NoCurrent = 6,
}

export enum SsiDiveSubType {
  FunDive = 24,
}

export enum SsiSurface {
  Calm = 10,
}
