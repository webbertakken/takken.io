import type { Dive } from '@site/src/domain/diving/Dive'
import React from 'react'

const FEET_PER_METER = 3.28084

/** Imperial first, metric on the right, matching the pressure readouts. */
const formatDepth = (meters: number): string => {
  const feet = Math.round(meters * FEET_PER_METER)
  return `${feet} ft / ${meters} m`
}

interface DiveStatsPanelProps {
  dive: Dive
}

export const DiveStatsPanel = ({ dive }: DiveStatsPanelProps): React.JSX.Element => (
  <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded p-3 w-full">
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
      <span>Avg depth</span>
      <span className="text-right font-medium">
        {dive.avgDepth !== undefined ? formatDepth(dive.avgDepth) : '—'}
      </span>

      <span>Start pressure</span>
      <span className="text-right font-medium">
        {dive.startPressure ? (
          <>
            {dive.startPressure.formatPsi()} / {dive.startPressure.formatBar()}
          </>
        ) : (
          '—'
        )}
      </span>

      <span>End pressure</span>
      <span className="text-right font-medium">
        {dive.endPressure ? (
          <>
            {dive.endPressure.formatPsi()} / {dive.endPressure.formatBar()}
          </>
        ) : (
          '—'
        )}
      </span>
    </div>
  </div>
)
