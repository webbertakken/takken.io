import { useBlogPost } from '@docusaurus/plugin-content-blog/client'
import type { WrapperProps } from '@docusaurus/types'
import CommentsSection from '@site/src/components/common/CommentsSection'
import BlogPostItem from '@theme-original/BlogPostItem'
import type BlogPostItemType from '@theme/BlogPostItem'
import React from 'react'

type Props = WrapperProps<typeof BlogPostItemType>

export default function BlogPostItemWrapper(props: Props): React.JSX.Element {
  const { isBlogPostPage } = useBlogPost()

  return (
    <>
      <BlogPostItem {...props} />
      {isBlogPostPage && (
        <CommentsSection category="Blog comments" categoryId="DIC_kwDOFNg3cs4CX7Xk" />
      )}
    </>
  )
}
