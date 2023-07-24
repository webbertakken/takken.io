import React from 'react'
import Giscus from '@giscus/react'
import { useColorMode } from '@docusaurus/theme-common'

interface Props {
  category: string
  categoryId: string
}

const CommentsSection = ({ category, categoryId }: Props): JSX.Element => {
  const { colorMode: theme } = useColorMode()

  return (
    <div role="region" aria-label="Comments section">
      <h2 style={{ margin: '40px 0 20px' }}>What are your thoughts?</h2>
      <Giscus
        id="comments"
        repo="webbertakken/takken.io"
        repoId="MDEwOlJlcG9zaXRvcnkzNDk3MTQyOTA="
        category={category}
        categoryId={categoryId}
        mapping="title"
        term="Welcome to @giscus/react component!"
        reactionsEnabled="1"
        emitMetadata="1"
        inputPosition="top"
        theme={theme === 'dark' ? 'transparent_dark' : 'light'}
        lang="en"
        loading="lazy"
      />
    </div>
  )
}

export default CommentsSection
