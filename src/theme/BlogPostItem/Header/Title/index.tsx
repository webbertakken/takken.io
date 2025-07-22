import React from 'react'
import clsx from 'clsx'
import Link from '@docusaurus/Link'
import { useBlogPost } from '@docusaurus/plugin-content-blog/client'
import type { Props } from '@theme/BlogPostItem/Header/Title'

export default function BlogPostItemHeaderTitle({ className }: Props): JSX.Element {
  const { metadata, isBlogPostPage } = useBlogPost()
  const { permalink, title } = metadata
  const TitleHeading = isBlogPostPage ? 'h1' : 'h2'
  return (
    <TitleHeading
      className={clsx('text-3xl leading-10 md:text-2xl md:leading-9', className)}
      itemProp="headline"
    >
      {isBlogPostPage ? (
        title
      ) : (
        <Link itemProp="url" to={permalink}>
          {title}
        </Link>
      )}
    </TitleHeading>
  )
}
