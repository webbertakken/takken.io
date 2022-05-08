import React from 'react'
import Link from 'next/link'
import { Empty } from 'antd'

import styles from './BlogPosts.module.scss'

const BlogPosts = ({ posts, selectedCategories }) => {
  const visibilityFilter = (post) => post.meta.categories.some((category) => selectedCategories.includes(category))

  const visiblePosts = posts?.filter(visibilityFilter) || []

  return (
    (visiblePosts.length >= 1 && (
      <ul className={styles.list}>
        {visiblePosts.map(({ slug, meta }) => {
          const { title, description, date } = meta

          return (
            <Link key={title} href={`/blog/${slug}`}>
              <li className={styles.post}>
                <sup>{date}</sup>
                <h1>{title}</h1>
                <summary>{description}</summary>
              </li>
            </Link>
          )
        })}
      </ul>
    )) || <Empty className={styles.empty} description="No published posts yet" />
  )
}

export default BlogPosts
