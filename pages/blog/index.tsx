import React from 'react'
import BlogIndexPage from '@/components/pages/Blog/BlogIndexPage'
import { GetStaticProps } from 'next'
import { getAllPosts } from '@/core/blog/static/getBlogPosts'

const BlogIndex = ({ posts, categories }) => <BlogIndexPage posts={posts} categories={categories} />

// Build time: Generate JSON for each given path
export const getStaticProps: GetStaticProps = async () => {
  const posts = getAllPosts().map(({ slug, meta }) => ({ slug, meta }))

  const categoriesWithDuplicates = [].concat.apply([], ...posts.map((post) => post.meta.categories))
  const categories = Array.from(new Set(categoriesWithDuplicates)).slice().sort()

  return { props: { posts, categories } }
}

export default BlogIndex
