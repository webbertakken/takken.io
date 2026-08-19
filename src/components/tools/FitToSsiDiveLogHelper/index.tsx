import QrCode from '@site/src/components/QrCode/QrCode'
import { useNotification } from '@site/src/core/hooks/useNotification'
import type { Dive } from '@site/src/domain/diving/Dive'
import type { FitFiles } from '@site/src/domain/diving/fit/FitFiles'
import type { FitMessages } from '@site/src/domain/diving/fit/FitMessages'
import { detectVendor, type FitVendor } from '@site/src/domain/diving/fit/FitVendor'
import { SsiDive } from '@site/src/domain/diving/ssi/SsiDive'
import Image from '@site/src/theme/IdealImage'
import ToolPage from '@theme/ToolPage/ToolPage'
import React, { useCallback, useEffect, useRef, useState } from 'react'
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
  /** True when the file came from the vendor this tool is not built for. */
  isVendorMismatch: boolean
}

/** The dives converted so far, and which one the diver is looking at. */
interface Gallery {
  dives: ParsedDive[]
  index: number
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const plural = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? '' : 's'}`

const diveMoment = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

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
  const [{ dives, index }, setGallery] = useState<Gallery>({ dives: [], index: 0 })
  const [problems, setProblems] = useState<string[]>([])
  const [notices, setNotices] = useState<string[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const notify = useNotification()

  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const [files] = useState(() => createFiles())
  // Uploads are serialised: the collector is shared, so a drop landing while an
  // earlier batch is still decoding must not interleave with it.
  const queue = useRef<Promise<void>>(Promise.resolve())

  const currentDive = dives[index]

  const runParse = useCallback(
    async (fileList: FileList | File[]): Promise<void> => {
      setIsParsing(true)

      const nextProblems: string[] = []
      const nextNotices: string[] = []
      const newDives: ParsedDive[] = []

      try {
        const summary = await files.add(fileList)

        for (const name of summary.unsupported) {
          nextProblems.push(`${name} is not a .fit or .zip file`)
        }
        for (const name of summary.emptyArchives) {
          nextProblems.push(`${name} holds no .fit files`)
        }
        for (const name of summary.unreadableArchives) {
          nextProblems.push(`${name} could not be opened`)
        }
        if (summary.duplicates >= 1) {
          nextNotices.push(`${plural(summary.duplicates, 'file')} skipped, already uploaded`)
        }

        for (const result of files) {
          if (result.error) {
            nextProblems.push(`${result.name}: ${result.error.message}`)
            continue
          }

          const { name, dive } = result

          try {
            const ssiDive = SsiDive.fromDive(dive)
            const detected = detectVendor(dive.messages)

            newDives.push({
              fileName: name,
              dive,
              ssiDive,
              diveQR: SsiDive.toQR(ssiDive),
              messages: dive.messages,
              isVendorMismatch: detected !== 'unknown' && detected !== vendor,
            })
          } catch (error) {
            nextProblems.push(`${name}: ${messageOf(error)}`)
          }
        }
      } catch (error) {
        nextProblems.push(messageOf(error))
      } finally {
        files.reset()
        setIsParsing(false)
      }

      setGallery((previous) => ({
        dives: [...previous.dives, ...newDives],
        // Land on the first dive of this batch, or stay put when none arrived.
        index: newDives.length >= 1 ? previous.dives.length : previous.index,
      }))
      setProblems(nextProblems)
      setNotices(nextNotices)

      if (newDives.length >= 1) notify.success(`${plural(newDives.length, 'dive')} parsed`)
    },
    [files, notify, vendor],
  )

  const parseFiles = useCallback(
    (fileList: FileList | File[]): Promise<void> => {
      queue.current = queue.current.then(() => runParse(fileList))

      return queue.current
    },
    [runParse],
  )

  const onUploadFile = async (): Promise<void> => {
    const fileInput = fileInputRef.current
    if (!fileInput?.files) return

    await parseFiles(fileInput.files)
    fileInput.value = ''
  }

  const goTo = (next: number): void => {
    setGallery((gallery) => ({
      ...gallery,
      index: Math.min(Math.max(0, next), gallery.dives.length - 1),
    }))
  }

  // Arrow keys page through the dives. Bound to the window because the button
  // that had focus becomes disabled on the first and last dive.
  useEffect(() => {
    if (dives.length <= 1) return

    const handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null
      const isTyping =
        target?.getAttribute?.('contenteditable') === 'true' ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')

      if (isTyping || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return

      event.preventDefault()
      goTo(index + (event.key === 'ArrowRight' ? 1 : -1))
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dives.length, index])

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

    const stopDragging = (): void => {
      dragCounter.current = 0
      setIsDragging(false)
    }

    const handleDrop = (event: DragEvent): void => {
      event.preventDefault()
      stopDragging()

      if (event.dataTransfer?.files) void parseFiles(event.dataTransfer.files)
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)
    // A drag that ends outside the window never fires dragleave.
    window.addEventListener('dragend', stopDragging)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
      window.removeEventListener('dragend', stopDragging)
    }
  }, [parseFiles])

  return (
    <ToolPage title={title}>
      <input
        type="file"
        ref={fileInputRef}
        accept=".fit,.zip"
        multiple
        aria-label={`Select ${vendorNoun} .fit or .zip files`}
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
              disabled={isParsing}
              aria-busy={isParsing}
              className="cursor-pointer px-4 py-2 bg-(--ifm-color-primary) rounded-sm border-solid border-(--ifm-color-primary-light) border w-40 text-white disabled:opacity-50"
            >
              {isParsing ? 'Reading files…' : `Select ${dives.length >= 1 ? 'more ' : ''}files`}
            </button>

            <div role="alert" className="w-full pt-2 text-red-600 dark:text-red-400">
              {problems.map((problem) => (
                <p key={problem} className="my-0">
                  {problem}
                </p>
              ))}
            </div>

            <div role="status" className="w-full text-sm text-gray-500 dark:text-gray-400">
              {notices.map((notice) => (
                <p key={notice} className="my-0">
                  {notice}
                </p>
              ))}
            </div>

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

      {currentDive?.isVendorMismatch && (
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
          <h2>Importing your dive</h2>

          <div className="flex gap-4 flex-col md:flex-row items-center">
            <div className="flex flex-col items-center gap-2">
              <div className="text-center">
                <h3 className="mb-0">{currentDive.fileName}</h3>
                {currentDive.dive.startTime && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 my-0">
                    {diveMoment.format(currentDive.dive.startTime)}
                  </p>
                )}
              </div>

              <QrCode value={currentDive.diveQR} />
              <DiveStatsPanel dive={currentDive.dive} />

              {dives.length > 1 && (
                <nav
                  aria-label="Dive files"
                  className="flex gap-4 justify-center items-center py-2"
                >
                  <button
                    type="button"
                    aria-label="Previous dive"
                    onClick={() => goTo(index - 1)}
                    disabled={index === 0}
                    className="cursor-pointer w-10 h-10 bg-(--ifm-color-primary) rounded-sm border-solid border-(--ifm-color-primary-light) border text-white disabled:opacity-50"
                  >
                    ←
                  </button>
                  <span className="text-sm" aria-live="polite">
                    Dive {index + 1} of {dives.length}
                  </span>
                  <button
                    type="button"
                    aria-label="Next dive"
                    onClick={() => goTo(index + 1)}
                    disabled={index === dives.length - 1}
                    className="cursor-pointer w-10 h-10 bg-(--ifm-color-primary) rounded-sm border-solid border-(--ifm-color-primary-light) border text-white disabled:opacity-50"
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

      {currentDive && (
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
