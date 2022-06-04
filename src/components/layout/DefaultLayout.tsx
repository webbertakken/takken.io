import React from 'react'
import cx from 'classnames'
import SocialLinks from '@site/src/components/layout/components/SocialLinks'
import styles from './DefaultLayout.module.scss'
import MainMenu from '@site/src/components/layout/components/MainMenu'

const BackgroundCanvas = import(
  '@site/src/components/layout/components/BackgroundCanvas/BackgroundCanvas'
)

const DefaultLayout = ({ children, wide = false }) => (
  <>
    <div className={styles.background} />
    <div className={cx(styles.main, { [styles.wide]: wide })}>
      <header className={styles.header}>
        <MainMenu />
      </header>
      <main className={styles.content}>{children}</main>
      <footer className={styles.footer}>
        <SocialLinks />
      </footer>
    </div>
  </>
)

export default DefaultLayout
