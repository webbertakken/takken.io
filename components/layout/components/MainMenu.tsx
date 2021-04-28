import React from 'react'
import Link from 'next/link'

import styles from './MainMenu.module.scss'

const MainMenu = () => (
  <div>
    <Link href="/blog">
      <a className={styles.link}>Blog</a>
    </Link>
    <Link href="/tools">
      <a className={styles.link}>Tools</a>
    </Link>
    <Link href="/comparisons">
      <a className={styles.link}>Comparisons</a>
    </Link>
  </div>
)

export default MainMenu
