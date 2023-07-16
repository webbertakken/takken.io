import React from 'react'
import Highlight, { defaultProps, Language } from 'prism-react-renderer'
import theme from 'prism-react-renderer/themes/dracula'
import cx from 'classnames'

import styles from './CodeBlockAndEditor.module.scss'

const Container = ({ className, ...props }) => (
  <pre {...props} className={cx(className, styles.container)} />
)
const Line = ({ className, ...props }) => <div {...props} className={cx(className, styles.line)} />
const LineNumber = (props) => <span {...props} className={styles.number} />
const LineContent = (props) => <span {...props} className={styles.content} />

/**
 * Takes 3 and 5 and returns [3,4,5]
 */
const getRange = (start: number | string, end: number | string | undefined, step: number = 1) => {
  start = Number(start)
  end = end ? Number(end) : Number(start)

  const range = []
  for (let i = start; i <= end; i += step) {
    range.push(i)
  }

  return range
}

/**
 * Takes "{1,3-5}" and turns it into [1, 3, 4, 5]
 */
const getRangeFromString = (input: string) => {
  const range = []

  const string = input.replace(/^{/, '').replace(/}$/, '')
  const groups = string.split(' ').join('').split(',')
  for (const group of groups) {
    const [start, end] = group.split('-')
    range.push(...getRange(start, end))
  }

  return range
}

interface CodeBlockProps {
  value: string
  language?: string
  className?: string
}

const CodeBlock = ({ value, language, className }: CodeBlockProps) => {
  language = language || ''

  // Match language and optionally highlights
  const meta = language.match(/(?<lang>\w+)(?<highlightString>{[\d-,]+})?/)?.groups
  const { lang, highlightString } = meta || {}
  const highlights = highlightString ? getRangeFromString(highlightString) : []

  return (
    <Highlight {...defaultProps} theme={theme} code={value} language={lang as Language}>
      {({ className: ownClass, style, tokens, getLineProps, getTokenProps }) => (
        <Container className={cx(ownClass, className)} style={style}>
          {tokens.map((line, i) => {
            const lineNumber = i + 1
            return (
              <Line
                key={lineNumber}
                {...getLineProps({
                  line,
                  key: lineNumber,
                  className: cx({
                    [styles.highlight]: highlights.includes(lineNumber),
                    [styles.highlightStart]: !highlights.includes(lineNumber - 1),
                    [styles.highlightEnd]: !highlights.includes(lineNumber + 1),
                  }),
                })}
              >
                <LineNumber>{lineNumber}</LineNumber>
                <LineContent>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token, key })} />
                  ))}
                </LineContent>
              </Line>
            )
          })}
        </Container>
      )}
    </Highlight>
  )
}

export default CodeBlock
