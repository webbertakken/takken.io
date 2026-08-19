import QrCode from '@site/src/components/QrCode/QrCode'
import { useNotification } from '@site/src/core/hooks/useNotification'
import type { Dive } from '@site/src/domain/diving/Dive'
import type { FitFiles } from '@site/src/domain/diving/fit/FitFiles'
import type { FitMessages } from '@site/src/domain/diving/fit/FitMessages'
import { detectVendor, type FitVendor } from '@site/src/domain/diving/fit/FitVendor'
import { SsiDive } from '@site/src/domain/diving/ssi/SsiDive'
import Image from '@site/src/theme/IdealImage'
import ToolPage from '@theme/ToolPage/ToolPage'
import React, { useEffect, useRef, useState } from 'react'
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

interface ParsedDive {
  fileName: string
  dive: Dive
  ssiDive: Partial<SsiDive>
  diveQR: string
  messages: FitMessages
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsedDives, setParsedDives] = useState<ParsedDive[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [mismatch, setMismatch] = useState<boolean>(false)
  const notify = useNotification()

  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const [files] = useState(() => createFiles())

  const currentDive = parsedDives[currentIndex]

  const parseFiles = React.useCallback(
    async (fileList: FileList | File[]): Promise<void> => {
      await files.add(fileList)

      const errors: Error[] = []
      let sawMismatch = false
      const newDives: ParsedDive[] = []

      try {
        for (const { name, dive } of files) {
          try {
            const detected = detectVendor(dive.messages)
            if (detected !== 'unknown' && detected !== vendor) sawMismatch = true

            const ssiDive = SsiDive.fromDive(dive)
            const diveQR = SsiDive.toQR(ssiDive)

            newDives.push({
              fileName: name,
              dive,
              ssiDive,
              diveQR,
              messages: dive.messages,
            })
          } catch (error) {
            // One unusable dive should not discard the others in the batch.
            errors.push(error instanceof Error ? error : new Error(String(error)))
          }
        }
      } catch (error) {
        // Decoding happens while iterating, so a corrupt file ends the batch.
        errors.push(error instanceof Error ? error : new Error(String(error)))
      }

      const nextDives = [...parsedDives, ...newDives]
      setParsedDives(nextDives)
      if (nextDives.length >= 1 && newDives.length >= 1) {
        setCurrentIndex(nextDives.length - newDives.length)
      }
      setMismatch(sawMismatch)
      setError(errors.length >= 1 ? errors.map((error) => error.message).join('\n') : null)

      if (newDives.length >= 1) {
        notify.success(newDives.length === 1 ? 'Dive parsed' : `${newDives.length} dives parsed`)
      }

      files.reset()
    },
    [files, notify, parsedDives, vendor],
  )

  const onUploadFile = async (): Promise<void> => {
    const fileInput = fileInputRef.current
    if (!fileInput?.files) return

    await parseFiles(fileInput.files)
    fileInput.value = ''
  }

  const goToPrevious = (): void => {
    setCurrentIndex((index) => Math.max(0, index - 1))
  }

  const goToNext = (): void => {
    setCurrentIndex((index) => Math.min(parsedDives.length - 1, index + 1))
  }

  useEffect(() => {
    const handleDragEnter = (event: DragEvent): void => {
      event.preventDefault()
      dragCounter.current += 1
      setIsDragging(true)
    }

    const handleDragLeave = (event: DragEvent): void => {
      event.preventDefault()
      dragCounter.current = Math.max(0, dragCounter.current - 1)
      if (dragCounter.current === 0) setIsDragging(false)
    }

    const handleDragOver = (event: DragEvent): void => {
      event.preventDefault()
    }

    const handleDrop = (event: DragEvent): void => {
      event.preventDefault()
      dragCounter.current = 0
      setIsDragging(false)

      if (event.dataTransfer?.files) {
        void parseFiles(event.dataTransfer.files)
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [parseFiles])

  return (
    <ToolPage title={title}>
      <link rel="dns-prefetch" href="https://chart.googleapis.com" />

      <input
        type="file"
        ref={fileInputRef}
        accept=".fit,.zip"
        multiple
        style={{ display: 'none' }}
        onInput={onUploadFile}
      />

      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <p className="text-white text-xl font-medium">Drop files here</p>
        </div>
      )}

      <div className="py-4">
        <div className="flex gap-4 flex-col-reverse md:flex-row md:items-center">
          <div className="flex flex-col items-center">
            <ul className="w-full">
              <li>
                Upload or drag and drop your {vendorNoun}{' '}
                <code className="text-blue-600 dark:text-blue-400">.fit</code> or{' '}
                <code className="text-blue-600 dark:text-blue-400">.zip</code> files
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
              Select {parsedDives.length > 0 ? 'more ' : ''}files
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

      {currentDive && (
        <div className="py-4">
          <h3>Importing your dive</h3>

          <div className="flex gap-4 flex-col md:flex-row items-center">
            <div className="flex flex-col items-center gap-2">
              <h2>{currentDive.fileName}</h2>

              <QrCode value={currentDive.diveQR} />
              <DiveStatsPanel dive={currentDive.dive} />

              {parsedDives.length > 1 && (
                <nav
                  aria-label="Dive files"
                  className="flex gap-4 justify-center items-center py-2"
                >
                  <button
                    type="button"
                    aria-label="Previous dive"
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    className="cursor-pointer px-3 py-1 bg-(--ifm-color-primary) rounded-sm border-solid border-(--ifm-color-primary-light) border text-white disabled:opacity-50"
                  >
                    ←
                  </button>
                  <span className="text-sm">
                    {currentIndex + 1} / {parsedDives.length}
                  </span>
                  <button
                    type="button"
                    aria-label="Next dive"
                    onClick={goToNext}
                    disabled={currentIndex === parsedDives.length - 1}
                    className="cursor-pointer px-3 py-1 bg-(--ifm-color-primary) rounded-sm border-solid border-(--ifm-color-primary-light) border text-white disabled:opacity-50"
                  >
                    →
                  </button>
                </nav>
              )}
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
              height={300}
              width={138.4}
              noPadding
            />
          </div>
        </div>
      )}

      {currentDive?.messages && (
        <div className="py-4">
          <details>
            <summary className="cursor-pointer">
              <h2 className="inline-block">Developer data</h2>
            </summary>

            <p style={{ opacity: 0.5 }}>{currentDive.diveQR}</p>

            {Object.keys(currentDive.messages).map((key) => (
              <details key={key}>
                <summary
                  className="cursor-pointer"
                  style={{ opacity: interestingMessages.includes(key) ? 1 : 0.5 }}
                >
                  {key}
                </summary>
                <code>
                  <pre>{JSON.stringify(currentDive.messages[key], null, 2)}</pre>
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
