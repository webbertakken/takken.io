import React from 'react'
import Heading from '@theme-original/MDXComponents/Heading'
import type HeadingType from '@theme/MDXComponents/Heading'
import type { WrapperProps } from '@docusaurus/types'
import { useLocation } from '@docusaurus/router'

type Props = WrapperProps<typeof HeadingType>

export default function HeadingWrapper(props: Props): JSX.Element {
  const location = useLocation()
  const isBlogPost = location.pathname.startsWith('/blog/')

  if (isBlogPost && props.as === 'h2') {
    return <Heading {...props} className="text-3xl leading-9 md:text-2xl md:leading-8" />
  }

  return <Heading {...props} />
}
