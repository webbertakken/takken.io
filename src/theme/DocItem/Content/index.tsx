import React from 'react'
import Content from '@theme-original/DocItem/Content'
import type ContentType from '@theme/DocItem/Content'
import type { WrapperProps } from '@docusaurus/types'
import CommentsSection from '@site/src/components/common/CommentsSection'

type Props = WrapperProps<typeof ContentType>

export default function ContentWrapper(props: Props): JSX.Element {
  return (
    <>
      <Content {...props} />
      <CommentsSection category="Notes comments" categoryId="DIC_kwDOFNg3cs4CYGtA" />
    </>
  )
}
