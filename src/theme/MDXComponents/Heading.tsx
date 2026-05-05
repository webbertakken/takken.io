import { useLocation } from '@docusaurus/router'
import type { WrapperProps } from '@docusaurus/types'
import Heading from '@theme-original/MDXComponents/Heading'
import type HeadingType from '@theme/MDXComponents/Heading'
import React from 'react'

type Props = WrapperProps<typeof HeadingType>

export default function HeadingWrapper(props: Props): React.JSX.Element {
  const location = useLocation()
  const isBlogPost = location.pathname.startsWith('/blog/')

  if (isBlogPost && props.as === 'h2') {
    return <Heading {...props} className="text-3xl leading-9 md:text-2xl md:leading-8" />
  }

  return <Heading {...props} />
}
