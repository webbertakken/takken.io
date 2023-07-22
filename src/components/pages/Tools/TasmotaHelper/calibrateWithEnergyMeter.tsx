import styles from '../Tools.module.scss'
import cx from 'classnames'
import Heading from '@site/src/components/common/heading'
import CodeBlock from '@site/src/components/common/CodeBlock'
import { dedent } from 'ts-dedent'
import React, { useEffect, useState } from 'react'

const CalibrateWithEnergyMeter = (): JSX.Element => {
  const [power, setPower] = useState<string>('63')
  const [voltage, setVoltage] = useState<string>('234.5')
  const [current, setCurrent] = useState<string>('0')

  useEffect(
    () => setCurrent((1000 * (parseFloat(power) / parseFloat(voltage))).toFixed(3)),
    [power, voltage],
  )

  return (
    <div className={cx(styles.flexRow, styles.section)}>
      <div className={styles.flexPanel}>
        <p>Calibrate power socket and energy meter</p>

        <Heading level={3}>Using Energy meter</Heading>
        <div className={styles.formRow}>
          <input
            style={{ width: '65px' }}
            type="number"
            pattern="0.00"
            step="0.1"
            value={power}
            onChange={(x) => setPower(x.target.value)}
          />
          <span>W</span>
        </div>
        <div className={styles.formRow}>
          <input
            style={{ width: '80px' }}
            type="number"
            prefix="V"
            pattern="0.0"
            step="0.5"
            value={voltage}
            onChange={(x) => setVoltage(x.target.value)}
          />
          <span>V</span>
        </div>

        <br />

        <Heading level={3}>Tasmota commands</Heading>

        <div className={styles.formRow}>
          <CodeBlock
            className={styles.codePanel}
            value={dedent`
                PowerSet ${power}
                VoltageSet ${voltage}
                CurrentSet ${current}
              `}
          />
        </div>
      </div>
    </div>
  )
}

export default CalibrateWithEnergyMeter
