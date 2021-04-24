import React, { useEffect, useState } from 'react'
import Heading from '@/components/markdown/components/heading'
import { useCookie } from '@/core/hooks/useCookie'

import styles from './PullRequestsToReleaseText.module.scss'
import CodeBlock from '@/components/markdown/components/CodeBlock'
import CodeEditor from '@/components/markdown/components/CodeEditor'

const exampleCopy = `Run license activation in an empty directory
#109 by txema-martinez-scopely was merged 3 hours ago 3 of 3
 1
 3

Add projectPath arg to license activation command
#107 by txema-martinez-scopely was closed 3 days ago 3 of 3
 3

Small results-check refactor for debugging
#104 by davidmfinol was merged 16 days ago 3 of 3
 1

Update versioning.yml
#101 by davidmfinol was merged 22 days ago 1 of 3
 1

Create versioning.yml
#100 by davidmfinol was merged 22 days ago 3 of 3
`

const PullRequestsToReleaseText = (props) => {
  const cookie = useCookie('release-text-generator-excluded-contributors', { expires: 10 * 365 })
  const [result, setResult] = useState<string>('')
  const [excludedContributors, setExcludedContributors] = useState<string[]>(cookie.getValue() || [])

  const convert = (rawPullRequestsString) => {
    const matcher = /(?<title>.+)\n(?<number>#\d+) by (?<contributor>[\w-]+)(?:\sbot)? was (?<action>closed|merged) (?<when>.*) ago/g
    const grouper = /(?<title>.+)\n(?<number>#\d+) by (?<contributor>[\w-]+)(?:\sbot)? was (?<action>closed|merged) (?<when>.*) ago/

    const matches = rawPullRequestsString.match(matcher)
    if (!matches) return setResult('')

    const changes = []
    const fixes = []
    const updates = []
    const credits = []
    for (const pullRequest of matches) {
      const { title, number, contributor, action, when } = pullRequest.match(grouper).groups

      if (!title || action === 'closed') continue

      const bulletPoint = `- ${number} ${title}`
      if (title.match(/introduce/i)) {
        changes.push(bulletPoint)
      } else if (title.match(/fix/i)) {
        fixes.push(bulletPoint)
      } else if (title.match(/refactor|update|bump|Security upgrade/i)) {
        updates.push(bulletPoint)
      } else {
        changes.push(bulletPoint)
      }

      const contributorMention = `@${contributor}`
      if (!credits.includes(contributorMention) && !excludedContributors.includes(contributor)) {
        credits.push(contributorMention)
      }
    }

    let releaseText = ''
    if (changes.length > 0) {
      releaseText += `**Changes:**\n\n${changes.join('\n')}\n\n`
    }
    if (fixes.length > 0) {
      releaseText += `**Fixes:**\n\n${fixes.join('\n')}\n\n`
    }
    if (updates.length > 0) {
      releaseText += `**Updates:**\n\n${updates.join('\n')}\n\n`
    }
    if (credits.length > 0) {
      releaseText += `**Credits:**\n\nThanks to ${credits.join(', ')} for their contributions!\n\n`
    }
    releaseText = releaseText.replace(/^\s+|\s+$/g, '')

    setResult(releaseText)
  }

  useEffect(() => convert(exampleCopy), [])

  return (
    <>
      <Heading level={1}>Release-text generator</Heading>
      <p>Select and copy the text of all pull requests that have not been released yet.</p>

      <div className={styles.flexRow}>
        <div className={styles.flexPanel}>
          <Heading level={3}>Paste here:</Heading>
          <CodeEditor className={styles.codePanel} onChange={convert} code={exampleCopy} />
        </div>

        <div className={styles.flexPanel}>
          <Heading level={3}>Results:</Heading>
          <CodeBlock className={styles.codePanel} value={result} />
        </div>
      </div>
    </>
  )
}

export default PullRequestsToReleaseText
