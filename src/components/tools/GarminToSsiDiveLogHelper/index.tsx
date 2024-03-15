import React, { createRef, useState } from 'react'
import ToolPage from '@theme/ToolPage/ToolPage'
import { useGarminFiles } from '@site/src/domain/diving/garmin/GarminFiles'
import { GarminDive } from '@site/src/domain/diving/garmin/GarminDive'
import { GarminMessages } from '@site/src/domain/diving/garmin/GarminMessages'
import { SsiDive } from '@site/src/domain/diving/ssi/SsiDive'

const interestingMessages = [
  'fileIdMesgs',
  'sportMesgs',
  'diveSettingsMesgs',
  'diveGasMesgs',
  'diveSummaryMesgs',
  'sessionMesgs',
  'recordMesgs',
  'tankSummaryMesgs',
]

const GarminToSsiDiveLogHelper = (): JSX.Element => {
  const fileInputRef = createRef<HTMLInputElement>()
  const [messages, setMessages] = useState<GarminMessages | null>(null)
  const [ssiDive, setSsiDive] = useState<Partial<SsiDive> | null>(null)
  const [diveQR, setDiveQR] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // const [firstName, setFirstName] = useState<string>()
  // const [lastName, setLastName] = useState<string>()
  const garminFiles = useGarminFiles()

  const onUploadFile = async (): Promise<void> => {
    const fileInput = fileInputRef.current
    if (!fileInput?.files) return

    await garminFiles.add(fileInput.files)

    const errors = []
    for (const dive of garminFiles) {
      try {
        setMessages(dive.messages)
        await parseDive(dive)
      } catch (error) {
        errors.push(error)
      }
    }

    setError(errors.length >= 1 ? errors.join('\n') : null)
  }

  const parseDive = async (garminDive: GarminDive): Promise<void> => {
    const dive = SsiDive.fromGarmin(garminDive)

    setSsiDive(dive)
    setDiveQR(SsiDive.toQR(dive))
  }

  return (
    <ToolPage title="SSI DiveLog helper">
      <link rel="dns-prefetch" href="https://chart.googleapis.com" />

      <div>
        <ul>
          <li>Upload your garmin .fit file</li>
          <li>Scan the resulting QR code in the SSI app</li>
          <li>Correct any details and save dive</li>
        </ul>

        {/*<div>*/}
        {/*  <label htmlFor="firstName" style={{ display: 'inline-block' }}>*/}
        {/*    <span style={{ display: 'block' }}>First name:</span>*/}
        {/*    <input*/}
        {/*      style={{ padding: 4, margin: '0 4px 4px 0', fontSize: '125%', width: 200 }}*/}
        {/*      type="text"*/}
        {/*      id="firstName"*/}
        {/*      name="firstName"*/}
        {/*      value={firstName}*/}
        {/*      onChange={(e) => setFirstName(e.target.value)}*/}
        {/*    />*/}
        {/*  </label>*/}
        {/*  <label htmlFor="lastName" style={{ display: 'inline-block' }}>*/}
        {/*    <span style={{ display: 'block' }}>Last name:</span>*/}
        {/*    <input*/}
        {/*      style={{ padding: 4, margin: '0 4px 4px 0', fontSize: '125%', width: 200 }}*/}
        {/*      type="text"*/}
        {/*      id="lastName"*/}
        {/*      name="lastName"*/}
        {/*      value={lastName}*/}
        {/*      onChange={(e) => setLastName(e.target.value)}*/}
        {/*    />*/}
        {/*  </label>*/}
        {/*</div>*/}

        <input
          type="file"
          ref={fileInputRef}
          accept="*.fit"
          style={{ display: 'none' }}
          onInput={onUploadFile}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--ifm-color-primary)',
            borderRadius: 5,
            border: '1px solid var(--ifm-color-primary-light)',
          }}
        >
          Select file
        </button>

        {error && <p style={{ display: 'inline-block', paddingLeft: 16, color: 'red' }}>{error}</p>}
      </div>
      {ssiDive && (
        <>
          <div>
            <br />
            <h2>Key information</h2>
            <p>Scan the QR code in your SSI app</p>
            <p style={{ opacity: 0.5 }}>{diveQR}</p>
            {/*<pre>*/}
            {/*  <code style={{ opacity: 0.5 }}>{JSON.stringify(ssiDive, null, 2)}</code>*/}
            {/*</pre>*/}
            <img
              alt="Dive QR code for scanning in SSI app"
              src={`https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${diveQR}&cho=UTF-8`}
            />
          </div>
        </>
      )}
      {messages && (
        <div>
          <br />
          <h2>Inspect messages</h2>
          {Object.keys(messages).map((key) => (
            <details key={key}>
              <summary
                style={{ cursor: 'pointer', opacity: interestingMessages.includes(key) ? 1 : 0.5 }}
              >
                {key}
              </summary>
              <code>
                <pre>{JSON.stringify(messages[key], null, 2)}</pre>
              </code>
            </details>
          ))}
        </div>
      )}
    </ToolPage>
  )
}

export default GarminToSsiDiveLogHelper
