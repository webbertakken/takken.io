import React from 'react'

import styles from './index.module.css'

interface Props {
  children: string
}

const PoemText = ({ children }: Props): JSX.Element => {
  return (
    <div>
      <div className={styles.poem}>{children}</div>
    </div>
  )
}

export default PoemText
