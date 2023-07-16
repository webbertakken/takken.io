import React from 'react'
import config from '@site/src/core/config'

interface ShareYourSuggestionsProps {
  prPath?: string
}

const ShareYourSuggestions = ({ prPath }: ShareYourSuggestionsProps) => {
  return (
    <div>
      <h4>Suggestions?</h4>
      <p>
        Please feel free to share them with me by{' '}
        <a href={`mailto:${config.emailAddress}`}>email</a>
        {prPath && (
          <>
            {' '}
            or as a{' '}
            <a target="_blank" href={`${config.repository}/blob/main/${prPath}`}>
              pull request
            </a>
          </>
        )}
        .
      </p>
    </div>
  )
}

export default ShareYourSuggestions
