import React from 'react'
import cx from 'classnames'
import SocialLinks from '@site/src/components/layout/components/SocialLinks'
import styles from './DefaultLayout.module.scss'
import MainMenu from '@site/src/components/layout/components/MainMenu'

const BackgroundCanvas = import('@site/src/components/layout/components/BackgroundCanvas/BackgroundCanvas')

const { Header, Footer, Content } = Layout

const DefaultLayout = ({ children, wide = false }) => (
  <>
    <BackgroundCanvas className={styles.background} />
    <div className={cx(styles.main, { [styles.wide]: wide })}>
      <Header className={styles.header}>
        <MainMenu />
      </Header>
      <Content className={styles.content}>{children}</Content>
      <Footer className={styles.footer}>
        <SocialLinks />
      </Footer>
    </div>
  </>
)

export default DefaultLayout
