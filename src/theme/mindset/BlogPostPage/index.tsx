import React, { useEffect, useState } from 'react'
import Layout from '@theme/Layout'
import MDXContent from '@theme/MDXContent'
import type { Props } from '@theme/BlogPostPage'
import Link from '@docusaurus/Link'
import Image from '@theme/IdealImage'

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

export default function MindsetBlogPostPage(props: Props): JSX.Element {
  const { content: BlogPostContent } = props
  const { metadata, frontMatter } = BlogPostContent
  const { title, nextItem, prevItem, editUrl } = metadata
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    // Use image from frontmatter, fallback to placeholder
    const extractedImage = frontMatter.image || '/images/mindset-placeholder.svg'
    setImageUrl(extractedImage)
  }, [frontMatter.image])

  return (
    <Layout title={title} description={frontMatter.description}>
      <div className="container mx-auto px-4 py-8 max-w-4xl relative">
        {/* Navigation arrows positioned close to content */}
        {prevItem && (
          <Link
            to={prevItem.permalink}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border"
            aria-label={`Previous: ${prevItem.title}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
        )}

        {nextItem && (
          <Link
            to={nextItem.permalink}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border"
            aria-label={`Next: ${nextItem.title}`}
          >
            <ChevronRight className="w-6 h-6" />
          </Link>
        )}

        {/* Content card */}
        <div className="p-8 border rounded-lg">
          <h1 className="mb-8">{title}</h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <MDXContent>
              <BlogPostContent />
            </MDXContent>
          </div>

          {imageUrl && (
            <div className="mt-8 rounded-lg overflow-hidden">
              <Image img={imageUrl} alt={title} className="w-full h-auto rounded-lg" />
            </div>
          )}

          {editUrl && (
            <div className="mt-8 pt-8 border-t">
              <a href={editUrl} target="_blank" rel="noopener noreferrer" className="text-sm">
                Edit this page
              </a>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
