import { toolStyles } from '../toolStyles'
import cx from 'classnames'
import Heading from '@site/src/components/common/heading'
import CodeBlock from '@site/src/components/common/CodeBlock'
import { dedent } from 'ts-dedent'
import React, { useEffect, useState } from 'react'

const CalibrateWithMultiMeter = (): JSX.Element => {
  const [wattage, setWattage] = useState<string>('0')
  const [voltage, setVoltage] = useState<string>('234.5')
  const [amperage, setAmperage] = useState<string>('0.27')

  useEffect(
    () => setWattage((parseFloat(voltage) * parseFloat(amperage)).toFixed(1)),
    [voltage, amperage],
  )

  return (
    <div className={cx(toolStyles.flexRow, toolStyles.section)}>
      <div className={toolStyles.flexPanel}>
        <p>Calibrate power socket and energy meter</p>

        <Heading level={3}>Using multi meter</Heading>
        <div className={toolStyles.formRow}>
          <input
            style={{ width: '80px' }}
            type="number"
            pattern="0.0"
            step="0.5"
            value={voltage}
            onChange={(x) => setVoltage(x.target.value)}
          />
          <span>V</span>
        </div>
        <div className={toolStyles.formRow}>
          <input
            style={{ width: '100px' }}
            type="number"
            pattern="0.000"
            step="0.01"
            value={amperage}
            onChange={(x) => setAmperage(x.target.value)}
          />
          <span>A</span>
        </div>

        <br />

        <Heading level={3}>Tasmota commands</Heading>

        <div className={toolStyles.formRow}>
          <CodeBlock
            className={toolStyles.codePanel}
            value={dedent`
                PowerSet ${wattage}
                VoltageSet ${voltage}
                CurrentSet ${parseFloat(amperage) * 1000}
              `}
          />
        </div>
      </div>
    </div>
  )
}

export default CalibrateWithMultiMeter
