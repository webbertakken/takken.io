import React from 'react'
import config from '@/core/config'
import { Alert } from 'antd'

interface ShareYourSuggestionsProps {
  prPath?: string
}

const ShareYourSuggestions = ({ prPath }: ShareYourSuggestionsProps) => {
  const description = (
    <>
      Please feel free to share them with me by <a href={`mailto:${config.emailAddress}`}>email</a>
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
    </>
  )

  return <Alert message="Suggestions?" description={description} type="info" showIcon />
}

export default ShareYourSuggestions
