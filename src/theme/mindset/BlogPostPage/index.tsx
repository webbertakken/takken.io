import React, { useEffect, useState, useRef } from 'react'
import Layout from '@theme/Layout'
import MDXContent from '@theme/MDXContent'
import type { Props } from '@theme/BlogPostPage'
import Image from '@theme/IdealImage'
import EditThisPage from '@theme/EditThisPage'
import { useHistory } from '@docusaurus/router'
import MindsetSkeleton from '@site/src/components/MindsetSkeleton'

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
  const [showSkeleton, setShowSkeleton] = useState(false)
  const history = useHistory()

  useEffect(() => {
    // Use image from frontmatter, fallback to placeholder
    const extractedImage = frontMatter.image || '/images/mindset-placeholder.svg'
    setImageUrl(extractedImage)

    // Hide skeleton when new page loads
    setShowSkeleton(false)
  }, [frontMatter.image])

  // Function to handle smooth page transitions
  const navigateWithTransition = (url: string, direction: 'left' | 'right') => {
    setShowSkeleton(true) // Show skeleton immediately
    history.push(url) // Navigate immediately
  }

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
          // Swipe right - go to previous (slides in from left)
          navigateWithTransition(prevItem.permalink, 'left')
        } else if (deltaX < 0 && nextItem) {
          // Swipe left - go to next (slides in from right)
          navigateWithTransition(nextItem.permalink, 'right')
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
        {/* Navigation arrows positioned at 50% viewport height - hide during skeleton */}
        {!showSkeleton && prevItem && (
          <button
            onClick={() => navigateWithTransition(prevItem.permalink, 'left')}
            className="fixed -left-3 xl:left-[calc(50vw-1rem-512px)] top-[50vh] z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border border-gray-300 dark:border-gray-600 flex items-center justify-center"
            aria-label={`Previous: ${prevItem.title}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {!showSkeleton && nextItem && (
          <button
            onClick={() => navigateWithTransition(nextItem.permalink, 'right')}
            className="fixed -right-3 xl:right-[calc(50vw-1rem-512px)] top-[50vh] z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border border-gray-300 dark:border-gray-600 flex items-center justify-center"
            aria-label={`Next: ${nextItem.title}`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Content - show skeleton only during transitions */}
        <div className="relative  w-full">
          {/* Show skeleton only when transitioning */}
          {showSkeleton && (
            <div className="skeleton-fade-in">
              <MindsetSkeleton />
            </div>
          )}

          {/* Real content - hide only during skeleton transitions */}
          {!showSkeleton && (
            <div className="content-fade-in">
              {/* Image always at the top */}
              {imageUrl && (
                <div className="pb-4">
                  <div className="w-full aspect-[2/1] overflow-hidden rounded-lg">
                    <Image img={imageUrl} alt={title} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {/* Title after image */}
              <h1>{title}</h1>

              {/* Text content after title */}
              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                style={{ height: '280px', overflow: 'hidden' }}
              >
                <MDXContent>
                  <BlogPostContent />
                </MDXContent>
              </div>

              {editUrl && <EditThisPage editUrl={editUrl} />}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
