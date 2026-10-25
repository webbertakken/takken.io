import { FitFiles } from '@site/src/domain/diving/fit/FitFiles'
import { GarminDive } from '@site/src/domain/diving/garmin/GarminDive'
import { GarminMessages } from '@site/src/domain/diving/garmin/GarminMessages'
import { useMemo } from 'react'

/** Collects Garmin `.fit`/`.zip` files and yields {@link GarminDive}s. */
export class GarminFiles extends FitFiles<GarminDive> {
  constructor() {
    super((messages) => new GarminDive(messages as GarminMessages))
  }
}

export function useGarminFiles(): GarminFiles {
  const garminFiles = useMemo(() => new GarminFiles(), [])

  return garminFiles
}
