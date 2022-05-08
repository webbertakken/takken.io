import React from 'react'

import styles from './SocialLinks.module.scss'

const Link = ({ children, ...props }) => (
  <span className={styles.link}>
    <a target="_blank" {...props}>
      {children}
    </a>
  </span>
)

const SocialLinks = () => (
  <div>
    <Link href="https://www.linkedin.com/in/webbertakken/">LinkedIn</Link>
    <Link href="https://github.com/webbertakken">GitHub</Link>
    <Link href="https://stackoverflow.com/users/3593896/webber">StackOverflow</Link>
  </div>
)

export default SocialLinks
