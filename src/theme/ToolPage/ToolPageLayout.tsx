import React, { ReactNode } from 'react'
import cx from 'classnames'
import Layout from '@theme/Layout'
import styles from './ToolPageLayout.module.css'

interface Props {
  children: ReactNode
  title?: string
  wide?: boolean
}

const ToolPageLayout = ({ children, title = '', wide = false }: Props): JSX.Element => {
  return (
    <Layout wrapperClassName={cx(styles.layout, { [styles.wide]: wide })}>
      {title && <h1>{title}</h1>}
      {children}
    </Layout>
  )
}

export default ToolPageLayout
