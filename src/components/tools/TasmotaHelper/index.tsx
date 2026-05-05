import ToolPage from '@theme/ToolPage/ToolPage'
import React from 'react'
import CalibrateWithEnergyMeter from './calibrateWithEnergyMeter'
import CalibrateWithMultiMeter from './calibrateWithMultiMeter'

const TasmotaHelper = (): React.JSX.Element => {
  return (
    <ToolPage title="Tasmota helper">
      <CalibrateWithEnergyMeter />
      <CalibrateWithMultiMeter />
    </ToolPage>
  )
}

export default TasmotaHelper
