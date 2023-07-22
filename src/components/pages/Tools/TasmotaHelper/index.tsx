import React, { useEffect, useState } from 'react'
import Heading from '@site/src/components/common/heading'
import styles from '../Tools.module.scss'
import CodeBlock from '@site/src/components/common/CodeBlock'
import { dedent } from 'ts-dedent'
import ToolPage from '@theme/ToolPage'
import cx from 'classnames'

const TasmotaHelper = (): JSX.Element => {
  const [power, setPower] = useState<number>(63)
  const [voltage, setVoltage] = useState<number>(234.5)
  const [current, setCurrent] = useState<string>('0')

  useEffect(() => setCurrent((1000 * (power / voltage)).toFixed(3)), [power, voltage])

  return (
    <ToolPage title="Tasmota helper">
      <div className={cx(styles.flexRow, styles.section)}>
        <div className={styles.flexPanel}>
          <p>Calibrate power socket and energy meter</p>

          <Heading level={3}>Type here</Heading>
          <div className={styles.formRow}>
            <input
              style={{ width: '60px' }}
              type="number"
              pattern="0.00"
              value={power}
              onChange={(x) => setPower(parseInt(x.target.value))}
            />
            <span>W</span>
          </div>
          <div className={styles.formRow}>
            <input
              style={{ width: '80px' }}
              type="number"
              prefix="V"
              pattern="0"
              value={voltage}
              onChange={(x) => setVoltage(parseFloat(x.target.value))}
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
    </ToolPage>
  )
}

export default TasmotaHelper
