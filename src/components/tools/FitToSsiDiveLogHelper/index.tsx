import QrCode from '@site/src/components/QrCode/QrCode'
import { useNotification } from '@site/src/core/hooks/useNotification'
import type { Dive } from '@site/src/domain/diving/Dive'
import type { FitFiles } from '@site/src/domain/diving/fit/FitFiles'
import type { FitMessages } from '@site/src/domain/diving/fit/FitMessages'
import { detectVendor, type FitVendor } from '@site/src/domain/diving/fit/FitVendor'
import { SsiDive } from '@site/src/domain/diving/ssi/SsiDive'
import Image from '@site/src/theme/IdealImage'
import ToolPage from '@theme/ToolPage/ToolPage'
import React, { createRef, useState } from 'react'
import { DiveStatsPanel } from './DiveStatsPanel'

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

/** A link to the sibling tool that handles the other dive-computer vendor. */
export interface CrossLink {
  vendorName: string
  href: string
}

export interface FitToSsiDiveLogHelperProps {
  /** ToolPage heading. */
  title: string
  /** Lower-case vendor noun used in the "Upload your <vendor> .fit" line. */
  vendorNoun: string
  /** The vendor this tool is built for; other vendors trigger a mismatch notice. */
  vendor: FitVendor
  /** Builds the vendor-specific file collector for the chosen files. */
  createFiles: () => FitFiles<Dive>
  /** `require()`d export-instructions image for the IdealImage component. */
  exportImage: React.ComponentProps<typeof Image>['img']
  /** Alt text for the export-instructions image. */
  exportImageAlt: string
  /** Rendered width of the export image, in px (reserve space, zero CLS). */
  exportImageWidth?: number
  /** Rendered height of the export image, in px (reserve space, zero CLS). */
  exportImageHeight?: number
  /** Extra instruction describing where to export the file in the vendor app. */
  exportNote?: React.ReactNode
  /** Link to the sibling tool for the other vendor. */
  crossLink: CrossLink
}

const FitToSsiDiveLogHelper = ({
  title,
  vendorNoun,
  vendor,
  createFiles,
  exportImage,
  exportImageAlt,
  exportImageWidth,
  exportImageHeight,
  exportNote,
  crossLink,
}: FitToSsiDiveLogHelperProps): React.JSX.Element => {
  const fileInputRef = createRef<HTMLInputElement>()
  const [messages, setMessages] = useState<FitMessages | null>(null)
  const [dive, setDive] = useState<Dive | null>(null)
  const [ssiDive, setSsiDive] = useState<Partial<SsiDive> | null>(null)
  const [diveQR, setDiveQR] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mismatch, setMismatch] = useState<boolean>(false)
  const notify = useNotification()

  const onUploadFile = async (): Promise<void> => {
    const fileInput = fileInputRef.current
    if (!fileInput?.files) return

    const files = createFiles()
    await files.add(fileInput.files)

    const errors = []
    let sawMismatch = false
    for (const dive of files) {
      try {
        setMessages(dive.messages)
        const detected = detectVendor(dive.messages)
        if (detected !== 'unknown' && detected !== vendor) sawMismatch = true
        parseDive(dive)
        notify.success('Dive parsed')
      } catch (error) {
        errors.push(error)
      }
    }

    setMismatch(sawMismatch)
    setError(errors.length >= 1 ? errors.join('\n') : null)
  }

  const parseDive = (dive: Dive): void => {
    const ssi = SsiDive.fromDive(dive)

    setDive(dive)
    setSsiDive(ssi)
    setDiveQR(SsiDive.toQR(ssi))
  }

  return (
    <ToolPage title={title}>
      <link rel="dns-prefetch" href="https://chart.googleapis.com" />

      <input
        type="file"
        ref={fileInputRef}
        accept=".fit,.zip"
        style={{ display: 'none' }}
        onInput={onUploadFile}
      />

      <div className="py-4">
        <div className="flex gap-4 flex-col-reverse md:flex-row md:items-center">
          <div className="flex flex-col items-center">
            <ul className="w-full">
              <li>
                Upload your {vendorNoun}{' '}
                <code className="text-blue-600 dark:text-blue-400">.fit</code> or{' '}
                <code className="text-blue-600 dark:text-blue-400">.zip</code> file
              </li>
              <li>Scan the resulting QR code in the SSI app</li>
              <li>Correct any details and save the dive</li>
              <li className="text-green-600 dark:text-green-400">This page does not store data</li>
            </ul>

            {exportNote && <p className="w-full">{exportNote}</p>}

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

            <p className="w-full pt-2 text-sm text-gray-500 dark:text-gray-400">
              Using a {crossLink.vendorName}?{' '}
              <a href={crossLink.href}>{crossLink.vendorName} to SSI dive log helper</a>
            </p>
          </div>

          <div>
            <Image
              img={exportImage}
              alt={exportImageAlt}
              width={exportImageWidth}
              height={exportImageHeight}
              noPadding
            />
          </div>
        </div>
      </div>

      {mismatch && (
        <div className="py-2">
          <p role="note" className="text-amber-600 dark:text-amber-400">
            This looks like a {crossLink.vendorName} file. It still converts here, but the{' '}
            <a href={crossLink.href}>{crossLink.vendorName} to SSI dive log helper</a> is tailored
            for it.
          </p>
        </div>
      )}

      {ssiDive && dive && (
        <div className="py-4">
          <h2>Importing your dive</h2>

          <div className="flex gap-4 flex-col md:flex-row items-center">
            <div className="flex flex-col items-center gap-2">
              <QrCode value={diveQR ?? ''} />
              <DiveStatsPanel dive={dive} />
            </div>
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

export default FitToSsiDiveLogHelper
