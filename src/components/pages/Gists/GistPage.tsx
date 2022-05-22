import React from 'react'
import DefaultLayout from '@site/src/components/layout/DefaultLayout'
import CodeEditor from '@site/src/components/markdown/components/CodeEditor'
import { Language } from 'prism-react-renderer'
import { isLanguageSupported } from '@site/src/components/markdown/components/supportedLanguages'
import { slugify } from '@site/src/core/utils/slugify'
import { Gist } from '@site/src/core/service/GitHub'

interface Props {
  gist: Gist
}

const mapGitHubLanguageToSupportedLanguage = (rawLanguage): Language => {
  const language = slugify(rawLanguage)

  if (isLanguageSupported(language)) return language as Language
  if (language.startsWith('git')) return 'git'
  if (language.startsWith('shell')) return 'bash'
  if (language.startsWith('powershell')) return 'bash'

  return undefined
}

const GistPage = ({ gist }: Props) => {
  const { created_at, updated_at } = gist
  const createdDate = new Date(created_at).toDateString()
  const updatedDate = new Date(updated_at).toDateString()

  return (
    <DefaultLayout>
      {Object.values(gist.files).map((file, index) => {
        const { language } = file

        return (
          <div key={file.filename}>
            {index === 0 ? <h1>{file.filename}</h1> : <h2>{file.filename}</h2>}

            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: '1em',
              }}
            >
              <sup>Created on {createdDate}</sup>
              <sup>Last updated on {updatedDate}</sup>
            </div>

            <CodeEditor
              code={file.content}
              language={mapGitHubLanguageToSupportedLanguage(language)}
            />
            <div style={{ paddingBottom: '1em' }} />
          </div>
        )
      })}
    </DefaultLayout>
  )
}

export default GistPage
