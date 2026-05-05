import { useLocation } from '@docusaurus/router'
import { useColorMode } from '@docusaurus/theme-common'
import Giscus from '@giscus/react'
import React from 'react'

interface Props {
  category: string
  categoryId: string
}

const CommentsSection = ({ category, categoryId }: Props): React.JSX.Element => {
  const { colorMode: theme } = useColorMode()
  const { pathname } = useLocation()

  return (
    <div role="region" aria-label="Comments section">
      <h2 className="anchor" style={{ margin: '40px 0 20px' }} id="comments">
        What are your thoughts?
        <a
          href="#comments"
          className="hash-link"
          aria-label="Direct link to the comments section"
          title="Direct link to the comments section"
        />
      </h2>

      {/*
       * The `key` forces a fresh `<giscus-widget>` (and its iframe) to mount on
       * every route change. Without it, Docusaurus' SPA navigation reuses the
       * same widget instance and — because all props below are static — the
       * giscus lit element never triggers `updateConfig`, leaving the previous
       * post's discussion visible.
       */}
      <Giscus
        key={pathname}
        id="comments"
        repo="webbertakken/takken.io"
        repoId="MDEwOlJlcG9zaXRvcnkzNDk3MTQyOTA="
        category={category}
        categoryId={categoryId}
        mapping="title"
        term="Comments"
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
