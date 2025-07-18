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

  // Swipe gesture support
  useEffect(() => {
    let startX = 0
    let startY = 0

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const deltaX = endX - startX
      const deltaY = endY - startY

      // Only trigger if horizontal swipe is dominant and significant
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0 && prevItem) {
          // Swipe right - go to previous
          window.location.href = prevItem.permalink
        } else if (deltaX < 0 && nextItem) {
          // Swipe left - go to next
          window.location.href = nextItem.permalink
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [nextItem, prevItem])

  return (
    <Layout title={title} description={frontMatter.description}>
      <div className="container mx-auto max-w-4xl relative margin-vert--lg">
        {/* Navigation arrows positioned at 50% viewport height */}
        {prevItem && (
          <Link
            to={prevItem.permalink}
            className="fixed -left-3 xl:left-[calc(50vw-1rem-512px)] top-[50vh] z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border border-gray-300 dark:border-gray-600 flex items-center justify-center"
            aria-label={`Previous: ${prevItem.title}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
        )}

        {nextItem && (
          <Link
            to={nextItem.permalink}
            className="fixed -right-3 xl:right-[calc(50vw-1rem-512px)] top-[50vh] z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border border-gray-300 dark:border-gray-600 flex items-center justify-center"
            aria-label={`Next: ${nextItem.title}`}
          >
            <ChevronRight className="w-6 h-6" />
          </Link>
        )}

        {/* Content */}
        <div>
          {imageUrl && (
            <div className="lg:hidden">
              <Image img={imageUrl} alt={title} className="w-full h-auto" />
            </div>
          )}

          <h1>{title}</h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <MDXContent>
              <BlogPostContent />
            </MDXContent>
          </div>

          {imageUrl && (
            <div className="hidden lg:block">
              <Image img={imageUrl} alt={title} className="w-full h-auto" />
            </div>
          )}

          {editUrl && (
            <div className="border-t">
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
