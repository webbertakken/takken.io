import React from 'react'

import styles from './MainMenu.module.scss'

const MainMenu = () => (
  <div>
    <a href="/blog">
      <span className={styles.link}>Blog</span>
    </a>
    <a href="/tools">
      <span className={styles.link}>Tools</span>
    </a>
    <a href="/comparisons">
      <span className={styles.link}>Comparisons</span>
    </a>
    {/*<a href="/gists">*/}
    {/*  <span className={styles.link}>Gists</span>*/}
    {/*</a>*/}
  </div>
)

export default MainMenu
