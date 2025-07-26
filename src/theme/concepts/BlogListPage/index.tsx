import React from 'react'
import Layout from '@theme/Layout'
import type { Props } from '@theme/BlogListPage'
import Link from '@docusaurus/Link'
import OptimizedThumbnail from '../components/OptimizedThumbnail'

export default function ConceptsBlogListPage(props: Props): JSX.Element {
  const { items, metadata } = props
  const { blogTitle, blogDescription } = metadata

  return (
    <Layout title={blogTitle} description={blogDescription}>
      <main className="main-wrapper mx-auto w-full max-w-7xl px-4 py-8">
        <h1>{blogTitle}</h1>
        <p>{blogDescription}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {items.map(({ content: BlogPostContent }) => {
            const { metadata: postMetadata, frontMatter } = BlogPostContent
            const { permalink, title } = postMetadata

            // Use image from frontmatter, fallback to placeholder
            const imageUrl = frontMatter.image || '/images/concepts-placeholder.svg'

            return (
              <Link key={permalink} to={permalink} className="group block h-full">
                <div className="h-full border-2 border-solid border-gray-300 dark:border-gray-500 rounded-sm hover:border-gray-400 dark:hover:border-gray-400 transition-colors overflow-hidden flex flex-col">
                  <div className="aspect-[2/1] overflow-hidden shrink-0">
                    <OptimizedThumbnail imageUrl={imageUrl} title={title} />
                  </div>
                  <div className="p-2 lg:p-3 flex items-center justify-center h-16 sm:h-16 md:h-20 lg:h-16">
                    <h3 className="text-xs sm:text-sm md:text-base lg:text-sm font-medium leading-tight text-center m-0">
                      {title}
                    </h3>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </Layout>
  )
}
