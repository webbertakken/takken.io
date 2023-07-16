import React from 'react'
import BlogPostItem from '@theme-original/BlogPostItem'
import type BlogPostItemType from '@theme/BlogPostItem'
import type { WrapperProps } from '@docusaurus/types'
import { useBlogPost } from '@docusaurus/theme-common/internal'
import CommentsSection from '@site/src/components/common/CommentsSection'

type Props = WrapperProps<typeof BlogPostItemType>

export default function BlogPostItemWrapper(props: Props): JSX.Element {
  const { isBlogPostPage } = useBlogPost()

  return (
    <>
      <BlogPostItem {...props} />
      {isBlogPostPage && <CommentsSection />}
    </>
  )
}
