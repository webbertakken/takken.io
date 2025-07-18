import React from 'react'
import Layout from '@theme/Layout'
import type { Props } from '@theme/BlogListPage'
import Link from '@docusaurus/Link'

function extractImageFromContent(content: unknown): string | null {
  try {
    // Convert content to string and extract image URL
    const contentStr = content?.toString() || ''
    const imgMatch = contentStr.match(/https:\/\/images\.unsplash\.com\/[^"'\s)]+/)
    return imgMatch?.[0] || null
  } catch {
    return null
  }
}

export default function MindsetBlogListPage(props: Props): JSX.Element {
  const { items } = props

  return (
    <Layout title="Mindset concepts" description="Concepts for mental growth and development">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-12">Mindset concepts</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {items.map(({ content: BlogPostContent }) => {
            const { metadata: postMetadata, frontMatter } = BlogPostContent
            const { permalink, title } = postMetadata

            // Extract image URL from frontmatter or content
            const imageUrl = frontMatter.image || extractImageFromContent(BlogPostContent)

            return (
              <Link
                key={permalink}
                to={permalink}
                className="group block no-underline hover:no-underline"
              >
                <div className="h-full p-4 border-2 border-solid border-gray-300 dark:border-gray-500 rounded hover:border-gray-400 dark:hover:border-gray-400 transition-colors">
                  {imageUrl && (
                    <div className="aspect-square mb-3 overflow-hidden rounded">
                      <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {title}
                  </h3>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
