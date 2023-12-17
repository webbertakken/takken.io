// @ts-ignore
import React, { ReactNode } from 'react'
// @ts-ignore
import cx from 'classnames'
// @ts-ignore
import Layout from '@theme/Layout'
// @ts-ignore
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
