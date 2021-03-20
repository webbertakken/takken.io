import React from 'react'
import { Layout } from 'antd'

import styles from './DefaultLayout.module.scss'
import SocialLinks from '@/components/layout/components/SocialLinks'

const { Header, Footer, Content } = Layout

const DefaultLayout = ({ children }) => (
  <Layout className={styles.main}>
    <Header className={styles.header} />
    <Content className={styles.content}>{children}</Content>
    <Footer className={styles.footer}>
      <SocialLinks />
    </Footer>
  </Layout>
)

export default DefaultLayout
