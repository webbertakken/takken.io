import ReactMarkdown from 'react-markdown'
import renderers from './markdown-to-page-mapping'
import React from 'react'

export interface MarkdownRendererProps {
  content: string
}

const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  return <ReactMarkdown source={content} renderers={renderers} />
}

export default MarkdownRenderer
