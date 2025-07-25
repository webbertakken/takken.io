import { useEffect, useState } from 'react'
import Heading from '@site/src/components/common/heading'
import CodeEditor from '@site/src/components/common/CodeEditor'
import { Base64 } from '@site/src/core/utils/base64'
import { md5 } from '@site/src/core/utils/md5'
import { sha256 } from '@site/src/core/utils/sha256'
import CodeBlock from '@site/src/components/common/CodeBlock'
import cx from 'classnames'
import ToolPage from '@theme/ToolPage/ToolPage'
import { toolStyles } from '../toolStyles'

const exampleCopy = `Cat ipsum dolor € sit amet, do not try to mix old food with new one to fool me!

but lick left leg for ninety minutes, still dirty spot something, big eyes, crouch, shake butt,

prepare to pounce for lick the other cats. Bite plants cough fur ball for ears back wide eyed whoops`

const TextAnalyser = (): JSX.Element => {
  // Basics
  const [lineCount, setLineCount] = useState<number>(0)
  const [characterCount, setCharacterCount] = useState<number>(0)
  const [wordCount, setWordCount] = useState<number>(0)
  const [byteSize, setByteSize] = useState<number>(0)

  // Encodings
  const [base64Encoded, setBase64Encoded] = useState<string>('')
  const [base64Decoded, setBase64Decoded] = useState<string>('')

  // Hashes
  const [md5Hash, setMd5Hash] = useState<string>('')
  const [sha256Hash, setSha256Hash] = useState<string>('')

  const analyse = (subject: string) => {
    // Lines
    const lineMatches = subject.match(/\n/g)
    setLineCount(lineMatches?.length + 1 || 1)

    // Characters
    setCharacterCount(subject.length)

    // Words
    const wordMatches = subject.match(/\w+/g)
    setWordCount(wordMatches?.length || 0)

    // Size
    setByteSize(new Blob([subject]).size)

    // Encoding
    setBase64Encoded(Base64.encode(subject))
    setBase64Decoded(Base64.decode(subject))

    // Hashed
    setMd5Hash(md5(subject))
    sha256(subject).then((hash) => setSha256Hash(hash))
  }

  useEffect(() => analyse(exampleCopy), [])

  return (
    <ToolPage title="Text analyser">
      <p>Paste any text and lets see what we can find out about it. text here.</p>

      <div className={cx(toolStyles.flexRow, toolStyles.grow)}>
        <div className={toolStyles.flexPanel}>
          <Heading level={3}>Paste here</Heading>
          <CodeEditor className={toolStyles.codePanel} onChange={analyse} code={exampleCopy} />
        </div>

        <div className={toolStyles.flexPanel}>
          <Heading level={3}>Results</Heading>
          <ul>
            <li>Words: {wordCount}</li>
            <li>Characters: {characterCount}</li>
            <li>Lines: {lineCount}</li>
            <li>Size: {byteSize} bytes</li>
          </ul>

          <Heading level={4}>Encodings</Heading>
          <ul>
            <li>
              Base64 encoded:
              <CodeBlock className={toolStyles.codePanel} value={base64Encoded} />
            </li>
            <li>
              Base64 decoded: <CodeBlock className={toolStyles.codePanel} value={base64Decoded} />
            </li>
          </ul>

          <Heading level={4}>Hashed</Heading>
          <ul>
            <li>
              md5: <CodeBlock className={toolStyles.codePanel} value={md5Hash} />
            </li>
            <li>
              sha: <CodeBlock className={toolStyles.codePanel} value={sha256Hash} />
            </li>
          </ul>
        </div>
      </div>
    </ToolPage>
  )
}

export default TextAnalyser
