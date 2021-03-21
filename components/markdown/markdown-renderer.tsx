// @ts-ignore
import ReactMarkdown from 'react-markdown'
import PropTypes, { InferProps } from 'prop-types'
import renderers from './markdown-to-page-mapping'
import React from 'react'
import Heading from '@/components/markdown/components/heading'
import { Space, Tag } from 'antd'
import EditOnGithubLink from '@/components/pages/Blog/EditOnGithubLink'

const propTypes = {
  content: PropTypes.string.isRequired,
  slug: PropTypes.string.isRequired,
  meta: PropTypes.shape({
    title: PropTypes.string,
    date: PropTypes.string,
    description: PropTypes.string,
    category: PropTypes.string,
  }).isRequired,
}

const MarkdownRenderer = ({ content, slug, meta }: InferProps<typeof propTypes>) => {
  const { title, date, /* description, */ category } = meta
  const metaInformation = `${date} - an X minute read`.replace(/(^\s-\s)|(\s-\s$)/, '')

  return (
    <div>
      <Heading level={1} children={title} />
      {/*<div>{description}</div>*/}
      <Tag>{category}</Tag>
      <div>
        <sub>{metaInformation}</sub>
      </div>
      <div style={{ width: '100%', paddingBottom: '5rem' }} />
      <ReactMarkdown source={content} renderers={renderers} />
      <EditOnGithubLink slug={slug} />
    </div>
  )
}

MarkdownRenderer.propTypes = propTypes

export default MarkdownRenderer
