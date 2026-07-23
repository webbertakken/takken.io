import { Dive } from '@site/src/domain/diving/Dive'
import {
  AirTempCelcius,
  DepthInMeters,
  DiveTimeInMinutes,
  MaxWaterTempCelcius,
  MinWaterTempCelcius,
  VisibilityInMeters,
} from '@site/src/domain/diving/Parameters'
import {
  SsiBodyOfWater,
  SsiCurrent,
  SsiDecompression,
  SsiDiveSite,
  SsiDiveSubType,
  SsiDiveType,
  SsiSurface,
  SsiEntry,
  SsiWaterType,
  SsiWeather,
} from '@site/src/domain/diving/ssi/SsiParameters'

export class SsiDive {
  dive: null = null
  noid: null = null
  dive_type!: SsiDiveType
  divetime!: DiveTimeInMinutes
  datetime!: number // 202310071315
  depth_m!: DepthInMeters
  site!: SsiDiveSite
  var_weather_id!: SsiWeather
  var_entry_id!: SsiEntry
  var_water_body_id!: SsiBodyOfWater
  var_watertype_id!: SsiWaterType
  var_current_id!: SsiCurrent
  var_surface_id!: SsiSurface
  var_divetype_id!: SsiDiveSubType // FunDive
  user_master_id?: number // 3554831
  user_firstname?: string
  user_lastname?: string
  user_leader_id!: number // Todo - confirm
  watertemp_c!: MinWaterTempCelcius
  airtemp_c!: AirTempCelcius
  vis_m!: VisibilityInMeters
  watertemp_max_c!: MaxWaterTempCelcius
  deco!: SsiDecompression

  static fromDive = (dive: Dive): Partial<SsiDive> => {
    return {
      dive: null,
      noid: null,
      dive_type: SsiDive.diveTypeFromSport(dive.sport),
      divetime: dive.diveTime,
      datetime: dive.startTime ? SsiDive.formatDate(dive.startTime) : undefined,
      depth_m: dive.maxDepth,
      // site:80095;
      // var_weather_id:2;
      // var_entry_id:21;
      // var_water_body_id:15;
      // var_watertype_id:4;
      // var_current_id:6;
      // var_surface_id:10;
      // var_divetype_id:23;
      // user_master_id:3679373; // Added if created from SSI app, seemingly not useful for importing
      user_firstname: dive.firstName || '', // Added if created from SSI app, seemingly not useful for importing
      user_lastname: dive.lastName || '', // Added if created from SSI app, seemingly not useful for importing
      // user_leader_id: number // Todo - confirm
      watertemp_c: dive.minTemperature,
      watertemp_max_c: dive.maxTemperature,
      // airtemp_c: AirTempCelcius
      // vis_m: VisibilityInMeters
      // deco: 0, // Note: Even when set to 0 it will open the deco settings in the SSI app, no deco should be property not present
    }
  }

  static toQR = (dive: Partial<SsiDive>): string => {
    return Object.entries(dive)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => (null === value ? key : `${key}:${value}`))
      .join(';')
  }

  private static formatDate = (date: Date): number => {
    const pad = (num: number, size: number): string => ('0'.repeat(size) + num).slice(-size)

    const year = pad(date.getFullYear(), 4)
    const month = pad(date.getMonth() + 1, 2)
    const day = pad(date.getDate(), 2)
    const hours = pad(date.getHours(), 2)
    const minutes = pad(date.getMinutes(), 2)

    return parseInt(`${year}${month}${day}${hours}${minutes}`)
  }

  private static diveTypeFromSport = (sport: string): SsiDiveType => {
    switch (sport) {
      case 'diving':
        return SsiDiveType.Scuba
      case 'freediving':
        return SsiDiveType.Freediving
      case 'extended_range':
        return SsiDiveType.ExtendedRange
      case 'rebreather_scr':
        return SsiDiveType.RebreatherSelfContained
      case 'rebreather_ccr':
        return SsiDiveType.RebreatherClosedCircuit
      default:
        throw new Error(`Unsupported sport ${sport}`)
    }
  }
}
