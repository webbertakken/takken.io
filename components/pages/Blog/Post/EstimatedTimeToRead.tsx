import React from 'react'

export const EstimatedTimeToRead = ({ text }) => {
  // This is how fast I read comfortably (accounting for code snippets)
  const wordsPerSecond = 2.7624
  const secondsToReadArticle = Math.ceil(text.split(' ').length / wordsPerSecond)

  const minutes = Math.floor(secondsToReadArticle / 60)
  const content = `⌚ ${minutes} ${minutes >= 2 ? 'minutes' : 'minute'} read`

  return <span>{content}</span>
}
