import React from 'react'
import Heading from '@theme-original/MDXComponents/Heading'
import type HeadingType from '@theme/MDXComponents/Heading'
import type { WrapperProps } from '@docusaurus/types'
import { useLocation } from '@docusaurus/router'
import styles from './styles.module.css'

type Props = WrapperProps<typeof HeadingType>

export default function HeadingWrapper(props: Props): JSX.Element {
  const location = useLocation()
  const isBlogPost = location.pathname.startsWith('/blog/')

  if (isBlogPost && props.as === 'h2') {
    return <Heading {...props} className={styles.blogH2} />
  }

  return <Heading {...props} />
}
