import React from 'react'
import ToolPage from '@theme/ToolPage'
import CalibrateWithEnergyMeter from '@site/src/components/pages/Tools/TasmotaHelper/calibrateWithEnergyMeter'
import CalibrateWithMultiMeter from '@site/src/components/pages/Tools/TasmotaHelper/calibrateWithMultiMeter'

const TasmotaHelper = (): JSX.Element => {
  return (
    <ToolPage title="Tasmota helper">
      <CalibrateWithEnergyMeter />
      <CalibrateWithMultiMeter />
    </ToolPage>
  )
}

export default TasmotaHelper
