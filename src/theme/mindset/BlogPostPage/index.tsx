import React, { useEffect, useState } from 'react'
import Layout from '@theme/Layout'
import MDXContent from '@theme/MDXContent'
import type { Props } from '@theme/BlogPostPage'
import Link from '@docusaurus/Link'

const ChevronLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

function extractImageFromContent(content: unknown): string | null {
  try {
    const contentStr = content?.toString() || ''
    const imgMatch = contentStr.match(/https:\/\/images\.unsplash\.com\/[^"'\s)]+/)
    return imgMatch?.[0] || null
  } catch {
    return null
  }
}

export default function MindsetBlogPostPage(props: Props): JSX.Element {
  const { content: BlogPostContent } = props
  const { metadata, frontMatter } = BlogPostContent
  const { title, nextItem, prevItem } = metadata
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    // Extract image from frontmatter or content
    const extractedImage = frontMatter.image || extractImageFromContent(BlogPostContent)
    setImageUrl(extractedImage)
  }, [frontMatter.image, BlogPostContent])

  return (
    <Layout title={title} description={frontMatter.description}>
      <div className="container mx-auto px-4 py-8 max-w-4xl relative">
        {/* Navigation arrows positioned close to content */}
        {prevItem && (
          <Link
            to={prevItem.permalink}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border border-gray-300 dark:border-gray-600"
            aria-label={`Previous: ${prevItem.title}`}
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </Link>
        )}

        {nextItem && (
          <Link
            to={nextItem.permalink}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border border-gray-300 dark:border-gray-600"
            aria-label={`Next: ${nextItem.title}`}
          >
            <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </Link>
        )}

        {/* Content card */}
        <div className="p-8 border-2 border-solid border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-900">
          <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100">
            {title}
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <MDXContent>
              <BlogPostContent />
            </MDXContent>
          </div>

          {imageUrl && (
            <div className="mt-8 rounded-lg overflow-hidden">
              <img src={imageUrl} alt={title} className="w-full h-auto rounded-lg" />
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
