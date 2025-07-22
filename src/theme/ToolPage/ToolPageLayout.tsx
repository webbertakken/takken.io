import React, { ReactNode } from 'react'
import cx from 'classnames'
import Layout from '@theme/Layout'

interface Props {
  children: ReactNode
  title?: string
  wide?: boolean
}

const ToolPageLayout = ({ children, title = '', wide = false }: Props): JSX.Element => {
  return (
    <Layout
      wrapperClassName={cx('w-full max-w-7xl mx-auto py-8 px-4', {
        'max-w-full w-full': wide,
      })}
    >
      {title && <h1>{title}</h1>}
      {children}
    </Layout>
  )
}

export default ToolPageLayout
