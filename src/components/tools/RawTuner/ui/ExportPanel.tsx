import { useState } from 'react'

interface Props {
  disabled: boolean
  onExportJpeg: (quality: number) => void
  onExportXmp: () => void
}

const DEFAULT_QUALITY = 0.92

const ExportPanel = ({ disabled, onExportJpeg, onExportXmp }: Props): React.JSX.Element => {
  const [quality, setQuality] = useState(DEFAULT_QUALITY)

  return (
    <div className="space-y-3">
      <h3 className="m-0 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Export
      </h3>
      <label className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-200">
        <span className="w-24 shrink-0">Quality</span>
        <input
          type="range"
          aria-label="Quality"
          min={0.4}
          max={1}
          step={0.01}
          value={quality}
          onChange={(event) => setQuality(Number(event.target.value))}
          className="flex-1 accent-pink dark:accent-pink-light"
        />
        <span className="w-12 shrink-0 text-right tabular-nums text-gray-500 dark:text-gray-400">
          {Math.round(quality * 100)}%
        </span>
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onExportJpeg(quality)}
          className="rounded bg-pink px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-pink/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-pink-light dark:text-gray-900"
        >
          Export JPEG
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onExportXmp}
          className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-pink hover:text-pink disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
        >
          Export .xmp sidecar
        </button>
      </div>
    </div>
  )
}

export default ExportPanel
