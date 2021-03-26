import React from 'react'
import { Layout } from 'antd'
import cx from 'classnames'

import styles from './DefaultLayout.module.scss'
import SocialLinks from '@/components/layout/components/SocialLinks'
import BackgroundCanvas from '@/components/layout/components/BackgroundCanvas'

const { Header, Footer, Content } = Layout

const DefaultLayout = ({ children, wide = false }) => (
  <Layout className={cx(styles.main, { [styles.wide]: wide })}>
    <BackgroundCanvas className={styles.background} />
    <Header className={styles.header} />
    <Content className={styles.content}>{children}</Content>
    <Footer className={styles.footer}>
      <SocialLinks />
    </Footer>
  </Layout>
)

export default DefaultLayout
