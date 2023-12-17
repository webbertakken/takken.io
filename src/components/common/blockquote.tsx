import React, { ReactNode } from 'react'
import styles from './blockquote.module.scss'

interface Props {
  children: ReactNode
}

const Blockquote = ({ children }: Props) => {
  return <blockquote className={styles.blockquote}>{children}</blockquote>
}

export default Blockquote
