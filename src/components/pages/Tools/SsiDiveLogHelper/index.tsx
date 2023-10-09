import React, { createRef, useState } from 'react'
import ToolPage from '@theme/ToolPage'
import { Decoder, Stream } from '@garmin-fit/sdk'
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

const SsiDiveLogHelper = (): JSX.Element => {
  const fileInputRef = createRef<HTMLInputElement>()
  const [messages, setMessages] = useState<GarminMessages | null>(null)
  const [ssiDive, setSsiDive] = useState<Partial<SsiDive> | null>(null)
  const [diveQR, setDiveQR] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [firstName, setFirstName] = useState<string>()
  const [lastName, setLastName] = useState<string>()
  const garminFiles = useGarminFiles()

  const onUploadFile = async (): Promise<void> => {
    // Select file

    const fileInput = fileInputRef.current
    if (!fileInput) return

    await garminFiles.add(fileInput.files)

    for (const [fileName, bytes] of garminFiles) {
      // Todo - render each file instead of one
      console.log('reading', fileName)
      const decoder = new Decoder(Stream.fromByteArray(bytes))

      // Check integrity
      if (!decoder.isFIT(bytes)) return setError('Unable to parse FIT file')
      if (!decoder.checkIntegrity()) return setError('Integrity check failed')

      // Todo - Scale messages / errors / display for multi-file

      // Check for errors
      const { messages, errors } = decoder.read({
        // convertTypesToStrings: false,
        includeUnknownData: false,
        mergeHeartRates: true,
      })
      if (errors.length >= 1) return setError(errors.join(','))

      // Update messages
      setMessages(messages)
      setError(null)

      console.log(messages)
      await parseDive(messages)
    }
  }

  const parseDive = async (messages: GarminMessages): Promise<void> => {
    const dive = SsiDive.fromGarmin(new GarminDive(messages))

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

        <div>
          <label htmlFor="firstName" style={{ display: 'inline-block' }}>
            <span style={{ display: 'block' }}>First name:</span>
            <input
              style={{ padding: 4, margin: '0 4px 4px 0', fontSize: '125%', width: 200 }}
              type="text"
              id="firstName"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </label>
          <label htmlFor="lastName" style={{ display: 'inline-block' }}>
            <span style={{ display: 'block' }}>Last name:</span>
            <input
              style={{ padding: 4, margin: '0 4px 4px 0', fontSize: '125%', width: 200 }}
              type="text"
              id="lastName"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </label>
        </div>

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
          style={{ padding: '8px 16px' }}
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

export default SsiDiveLogHelper
