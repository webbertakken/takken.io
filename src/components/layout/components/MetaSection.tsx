import React from 'react'
import cx from 'classnames'
import styles from './MetaSection.module.scss'
import { ReactNodeLike } from 'prop-types'

interface MetaSectionProps {
  position: 'top' | 'bottom'
  className?: string
  children: ReactNodeLike
}

const MetaSection = ({ position, className, children }: MetaSectionProps) => {
  const classes = cx(className, styles.metaSection, {
    [styles.top]: position === 'top',
    [styles.bottom]: position === 'bottom',
  })

  return <div className={classes}>{children}</div>
}

export default MetaSection
