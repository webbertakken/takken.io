import React from 'react'
import ToolPage from '@theme/ToolPage/ToolPage'
import CalibrateWithEnergyMeter from './calibrateWithEnergyMeter'
import CalibrateWithMultiMeter from './calibrateWithMultiMeter'

const TasmotaHelper = (): JSX.Element => {
  return (
    <ToolPage title="Tasmota helper">
      <CalibrateWithEnergyMeter />
      <CalibrateWithMultiMeter />
    </ToolPage>
  )
}

export default TasmotaHelper
