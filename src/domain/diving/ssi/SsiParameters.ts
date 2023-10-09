// deco ✅
export enum SsiDecompression {
  No = 0,
  Yes = 1,
}

// dive_type ✅
export enum SsiDiveType {
  Scuba = 0,
  ExtendedRange = 2,
  RebreatherSelfContained = 4,
  Freediving = 6,
  RebreatherClosedCircuit = 8,
}

// ✅
export type SsiDiveSite = number // 12345

// var_weather_id ✅
export enum SsiWeather {
  Cloudless = 1,
  Cloudy = 2,
  Rainy = 3,
  Snow = 121,
}

// var_entry_id ✅
export enum SsiEntry {
  ShoreOrBeach = 21,
  Boat = 22,
  Other = 35,
}

// var_water_body_id ❌ Incomplete
export enum SsiBodyOfWater {
  Ocean = 13,
  River = 14,
  Quarry = 15,
  Lake = 16,
  Indoor = 17,
  OpenWater = 54,
}

// var_watertype_id ✅
export enum SsiWaterType {
  Fresh = 4,
  Salt = 5,
}

// var_current_id ✅
export enum SsiCurrent {
  NoCurrent = 6,
  LightCurrent = 7,
  StrongCurrent = 8,
  RippingCurrent = 9,
}

// var_surface_id ✅
export enum SsiSurface {
  Calm = 10,
  Moving = 11,
  Stormy = 12,
}

// var_divetype_id ✅
export enum SsiDiveSubType {
  Education = 23,
  FunDive = 24,
  Scientific = 138,
  Work = 139,
}
