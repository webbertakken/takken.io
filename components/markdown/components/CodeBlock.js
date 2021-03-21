import React from 'react'
import PropTypes from 'prop-types'
import * as highlighter from 'highlight.js/lib/core'

import styles from './CodeBlock.module.scss'

highlighter.registerLanguage('yaml', require('highlight.js/lib/languages/yaml'))
highlighter.registerLanguage('csharp', require('highlight.js/lib/languages/csharp'))
highlighter.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'))
highlighter.registerLanguage('typescript', require('highlight.js/lib/languages/typescript'))
highlighter.registerLanguage('bash', require('highlight.js/lib/languages/bash'))
highlighter.registerLanguage('powershell', require('highlight.js/lib/languages/powershell'))

class CodeBlock extends React.PureComponent {
  constructor(properties) {
    super(properties)
    this.setRef = this.setRef.bind(this)
  }

  componentDidMount() {
    this.highlightCode()
  }

  componentDidUpdate() {
    this.highlightCode()
  }

  setRef(element) {
    this.codeEl = element
  }

  highlightCode() {
    highlighter.highlightBlock(this.codeEl)
  }

  render() {
    const { value, language } = this.props
    return (
      <pre className={styles.codeBlock} style={{ backgroundColor: '#282a36' }}>
        <div ref={this.setRef} className={`language-${language}`}>
          {value}
        </div>
      </pre>
    )
  }
}

CodeBlock.defaultProps = {
  language: '',
}

CodeBlock.propTypes = {
  value: PropTypes.string.isRequired,
  language: PropTypes.string,
}

export default CodeBlock
