import React from 'react'
import { Tag } from 'antd'
import DefaultLayout from '@site/src/components/layout/DefaultLayout'
import Heading from '@site/src/components/markdown/components/heading'
import EditOnGithubLink from '@site/src/components/pages/Blog/Posts/EditOnGithubLink'
import MarkdownRenderer from '@site/src/components/markdown/markdown-renderer'
import { EstimatedTimeToRead } from '@site/src/components/pages/Blog/Posts/EstimatedTimeToRead'

import styles from './BlogPost.module.scss'

export interface BlogPostPageProps {
  content: string
  slug: string
  meta: {
    title: string
    date: string
    description: string
    categories: string[]
  }
}

const BlogPostPage = ({ content, slug, meta }: BlogPostPageProps) => {
  const { title, date, categories } = meta

  return (
    <DefaultLayout>
      <div className={styles.spaceAbove} />

      <Heading level={1} children={title} />

      <div className={styles.topMetaInformation}>
        {categories.map((category) => (
          <Tag key={category}>{category}</Tag>
        ))}

        <sub className={styles.metaSubs}>
          <span>📅 {date}</span>
          <EstimatedTimeToRead text={content} />
        </sub>
      </div>

      <MarkdownRenderer content={content} />

      <div className={styles.bottomMetaInformation}>
        <EditOnGithubLink slug={slug} />
      </div>
    </DefaultLayout>
  )
}

export default BlogPostPage
