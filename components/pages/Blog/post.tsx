import React from 'react'
import DefaultLayout from '@/components/layout/DefaultLayout'
import PropTypes, { InferProps } from 'prop-types'
import MarkdownRenderer from '@/components/markdown/markdown-renderer'

const propTypes = {
  slug: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  meta: PropTypes.shape({ title: PropTypes.string, date: PropTypes.string }).isRequired,
}

const BlogPostPage = ({ content, slug, meta }: InferProps<typeof propTypes>) => (
  <DefaultLayout>
    <MarkdownRenderer meta={meta} slug={slug} content={content} />
  </DefaultLayout>
)

export default BlogPostPage
