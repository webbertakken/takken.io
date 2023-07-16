import React from 'react'
import Giscus from '@giscus/react'
import { useColorMode } from '@docusaurus/theme-common'

const CommentsSection = (): JSX.Element => {
  const { colorMode: theme } = useColorMode()

  return (
    <div role="region" aria-label="Comments section">
      <h2 style={{ margin: '40px 0 20px' }}>What are your thoughts?</h2>
      <Giscus
        id="comments"
        repo="webbertakken/takken.io"
        repoId="MDEwOlJlcG9zaXRvcnkzNDk3MTQyOTA="
        category="Blog comments"
        categoryId="DIC_kwDOFNg3cs4CX7Xk"
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
