import React from 'react'
import { Layout } from 'antd'
import cx from 'classnames'
import dynamic from 'next/dynamic'
import SocialLinks from '@/components/layout/components/SocialLinks'
import styles from './DefaultLayout.module.scss'
import MainMenu from '@/components/layout/components/MainMenu'

const BackgroundCanvas = dynamic(() => import('@/components/layout/components/BackgroundCanvas/BackgroundCanvas'))

const { Header, Footer, Content } = Layout

const DefaultLayout = ({ children, wide = false }) => (
  <>
    <BackgroundCanvas className={styles.background} />
    <Layout className={cx(styles.main, { [styles.wide]: wide })}>
      <Header className={styles.header}>
        <MainMenu />
      </Header>
      <Content className={styles.content}>{children}</Content>
      <Footer className={styles.footer}>
        <SocialLinks />
      </Footer>
    </Layout>
  </>
)

export default DefaultLayout
