import { GetStaticProps, GetStaticPaths } from 'next'
import BlogPostPage from '@/components/pages/Blog/post'

import { getPostBySlug, getAllPosts } from '@/core/blog/static/blogPosts'

// Build time: Determines which pages are generated
export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts()
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }))

  return { paths, fallback: false }
}

interface StaticProps {
  params: { [key: string]: string[] }
}

// Build time: Generate JSON for each given path
export const getStaticProps: GetStaticProps = async ({ params }: StaticProps) => {
  const post = getPostBySlug(params.slug)

  return { props: { ...post } }
}

export default BlogPostPage
