import React, { ReactNode } from 'react'
import cx from 'classnames'
import styles from './MetaSection.module.scss'

interface MetaSectionProps {
  position: 'top' | 'bottom'
  className?: string
  children: ReactNode
}

const MetaSection = ({ position, className, children }: MetaSectionProps) => {
  const classes = cx(className, styles.metaSection, {
    [styles.top]: position === 'top',
    [styles.bottom]: position === 'bottom',
  })

  return <div className={classes}>{children}</div>
}

export default MetaSection
