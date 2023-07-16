import React from 'react'
import Giscus from '@giscus/react'

const CommentsSection = (): JSX.Element => {
  return (
    <Giscus
      id="comments"
      repo="webbertakken/takken.io"
      repoId="MDEwOlJlcG9zaXRvcnkzNDk3MTQyOTA="
      category="Blog comments"
      categoryId="DIC_kwDOFNg3cs4CX7Xk"
      mapping="specific"
      term="Welcome to @giscus/react component!"
      reactionsEnabled="1"
      emitMetadata="1"
      inputPosition="top"
      theme="preferred_color_scheme"
      lang="en"
      loading="lazy"
    />
  )
}

export default CommentsSection
