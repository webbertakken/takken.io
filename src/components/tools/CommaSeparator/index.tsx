import React, { useEffect, useState } from 'react'
import Heading from '@site/src/components/common/heading'
import styles from '../Tools.module.scss'
import CodeBlock from '@site/src/components/common/CodeBlock'
import CodeEditor from '@site/src/components/common/CodeEditor'
import ToolPage from '@theme/ToolPage/ToolPage'
import cx from 'classnames'

const exampleCopy = `\n\nWinter\n\nWarm tones\n\nTop\n\nSunset\n\nPôr-do-sol\n\n`

const PullRequestsToReleaseText = () => {
  const [input, setInput] = useState<string>(exampleCopy)
  const [result, setResult] = useState<string>('')

  const [splitRegex, setSplitRegex] = useState<string>('\\n')
  const [isRegexValid, setIsRegexValid] = useState<boolean>(true)
  const [matchCount, setMatchCount] = useState<number>(0)

  const [trimLeading, setTrimLeading] = useState<boolean>(true)
  const [trimTrailing, setTrimTrailing] = useState<boolean>(true)
  const [matchMultiple, setMatchMultiple] = useState<boolean>(true)

  const [separator, setSeparator] = useState<string>(', ')

  const escapeRegex = (input: string) => input.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')

  useEffect(() => {
    try {
      const regex = matchMultiple
        ? new RegExp(`(${splitRegex})+`, 'g')
        : new RegExp(splitRegex, 'g')

      setIsRegexValid(true)
      setMatchCount(input.match(regex).length)

      let newResult = input.replace(regex, separator)
      if (trimLeading) {
        newResult = newResult.replace(new RegExp(`^(${escapeRegex(separator)})+`), '')
      }
      if (trimTrailing) {
        newResult = newResult.replace(new RegExp(`(${escapeRegex(separator)})+$`), '')
      }
      setResult(newResult)
    } catch {
      setIsRegexValid(false)
      return
    }
  }, [input, splitRegex, separator, trimLeading, trimTrailing, matchMultiple])

  return (
    <ToolPage title="Comma Separator">
      <p>Copy a collection of things here, then split it using your rules!</p>

      <div className={cx(styles.flexRow, styles.grow)}>
        <div className={styles.flexPanel}>
          <Heading level={3}>Paste here</Heading>
          <CodeEditor className={styles.codePanel} onChange={setInput} code={input} />
        </div>

        <div className={styles.flexPanel}>
          <Heading level={3}>Configuration</Heading>
          <Heading level={4}>Input</Heading>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            <li>
              Split regex {isRegexValid ? '✅' : '❌'} ({matchCount} matches)
              <CodeEditor
                className={cx(styles.codePanel, { [styles.borderRed]: !isRegexValid })}
                onChange={setSplitRegex}
                code={splitRegex}
              />
            </li>
            <li>
              <input
                id="trimLeading"
                type="checkbox"
                onChange={(e) => setTrimLeading(e.target.checked)}
                checked={trimLeading}
              />
              <label htmlFor="trimLeading">Trim leading</label>
              <span style={{ padding: '0px .5em', color: 'gray' }}>│</span>
              <input
                id="trimTrailing"
                type="checkbox"
                onChange={(e) => setTrimTrailing(e.target.checked)}
                checked={trimTrailing}
              />
              <label htmlFor="trimTrailing">Trim trailing</label>{' '}
              <span style={{ padding: '0px .5em', color: 'gray' }}>│</span>
              <input
                id="matchMultiple"
                type="checkbox"
                onChange={(e) => setMatchMultiple(e.target.checked)}
                checked={matchMultiple}
              />
              <label htmlFor="matchMultiple">Match multiple</label>
            </li>
          </ul>

          <Heading level={4}>Output</Heading>

          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            <li>
              Separator ✅
              <CodeEditor className={styles.codePanel} onChange={setSeparator} code={separator} />
            </li>
          </ul>
          <Heading level={3}>Results</Heading>
          <CodeBlock className={styles.codePanel} value={result} />
        </div>
      </div>
    </ToolPage>
  )
}

export default PullRequestsToReleaseText
