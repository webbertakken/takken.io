import { GetStaticProps, GetStaticPaths } from 'next'
import BlogPostPage from '@/components/pages/Blog/Post/BlogPostPage'

import { getPostBySlug, getAllPosts } from '@/core/blog/static/blogPosts'

// Build time: Determines which pages are generated
export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts()
  const paths = posts.map((post) => ({
    params: { post: post.slug },
  }))

  return { paths, fallback: false }
}

interface StaticProps {
  params: { [key: string]: string[] }
}

// Build time: Generate JSON for each given path
export const getStaticProps: GetStaticProps = async ({ params }: StaticProps) => {
  const post = getPostBySlug(params.post)

  return { props: { ...post } }
}

export default BlogPostPage
