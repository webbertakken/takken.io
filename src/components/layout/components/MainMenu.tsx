import React from 'react'

import styles from './MainMenu.module.scss'

const MainMenu = () => (
  <div>
    <a href="/blog">
      <a className={styles.link}>Blog</a>
    </a>
    <a href="/tools">
      <a className={styles.link}>Tools</a>
    </a>
    <a href="/comparisons">
      <a className={styles.link}>Comparisons</a>
    </a>
    <a href="/gists">
      <a className={styles.link}>Gists</a>
    </a>
  </div>
)

export default MainMenu
