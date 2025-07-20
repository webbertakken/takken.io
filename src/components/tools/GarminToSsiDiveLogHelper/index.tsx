import React, { createRef, useState } from 'react'
import ToolPage from '@theme/ToolPage/ToolPage'
import { GarminFiles } from '@site/src/domain/diving/garmin/GarminFiles'
import { GarminDive } from '@site/src/domain/diving/garmin/GarminDive'
import { GarminMessages } from '@site/src/domain/diving/garmin/GarminMessages'
import { SsiDive } from '@site/src/domain/diving/ssi/SsiDive'
import QrCode from '@site/src/components/QrCode/QrCode'
import Image from '@site/src/theme/IdealImage'
import { useNotification } from '@site/src/core/hooks/useNotification'

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
  const notify = useNotification()

  const onUploadFile = async (): Promise<void> => {
    const fileInput = fileInputRef.current
    if (!fileInput?.files) return

    // Idea: Could also use `useGarminFiles` to keep adding uploaded files to the UI
    const garminFiles = new GarminFiles()
    await garminFiles.add(fileInput.files)

    const errors = []
    for (const dive of garminFiles) {
      try {
        setMessages(dive.messages)
        await parseDive(dive)
        notify.success('Dive parsed')
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
    <ToolPage title="Garmin to SSI DiveLog helper">
      <link rel="dns-prefetch" href="https://chart.googleapis.com" />

      <input
        type="file"
        ref={fileInputRef}
        accept="*.fit,*.zip"
        style={{ display: 'none' }}
        onInput={onUploadFile}
      />

      <div className="py-4">
        <div className="flex gap-4 flex-col-reverse md:flex-row md:items-center">
          <div className="flex flex-col items-center">
            <ul className="w-full">
              <li>
                Upload your garmin <code className="text-blue-600 dark:text-blue-400">.fit</code> or{' '}
                <code className="text-blue-600 dark:text-blue-400">.zip</code> file
              </li>
              <li>Scan the resulting QR code in the SSI app</li>
              <li>Correct any details and save the dive</li>
              <li className="text-green-600 dark:text-green-400">This page does not store data</li>
            </ul>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer px-4 py-2 bg-(--ifm-color-primary) rounded-sm border-solid border-(--ifm-color-primary-light) border w-40 text-white"
            >
              Select {ssiDive ? 'another ' : ''}file
            </button>

            {error && (
              <p style={{ display: 'inline-block', paddingLeft: 16, color: 'red' }}>{error}</p>
            )}
          </div>

          <div>
            <Image
              img={require('./assets/exporting-dive-activity-from-garmin-dashboard.png')}
              alt="SSI app showing the QR code scanner"
              noPadding
            />
          </div>
        </div>
      </div>
      {ssiDive && (
        <>
          <div className="py-4">
            <h2>Importing your dive</h2>

            <div className="flex gap-4 flex-col md:flex-row items-center">
              <QrCode value={diveQR} />
              <div className="flex flex-col-reverse md:flex-col">
                <p>
                  First click the QR code icon in the app
                  <span className="hidden md:inline-block">&nbsp;{'->'}</span>
                </p>
                <p>
                  <span className="hidden md:inline-block">{'<-'}&nbsp;</span>Then scan this
                </p>
              </div>
              <Image
                img={require('./assets/ssi-app-showing-the-qr-code-scanner.png')}
                alt="SSI app showing the QR code scanner"
                height={400}
                width={184.5}
                noPadding
              />
            </div>
          </div>
        </>
      )}

      {messages && (
        <div className="py-4">
          <details>
            <summary className="cursor-pointer">
              <h2 className="inline-block">Developer data</h2>
            </summary>

            <p style={{ opacity: 0.5 }}>{diveQR}</p>

            {Object.keys(messages).map((key) => (
              <details key={key}>
                <summary
                  className="cursor-pointer"
                  style={{ opacity: interestingMessages.includes(key) ? 1 : 0.5 }}
                >
                  {key}
                </summary>
                <code>
                  <pre>{JSON.stringify(messages[key], null, 2)}</pre>
                </code>
              </details>
            ))}
          </details>
        </div>
      )}
    </ToolPage>
  )
}

export default GarminToSsiDiveLogHelper
