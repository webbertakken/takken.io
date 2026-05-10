import { useCallback, useEffect, useRef, useState } from 'react'
import { apply, getApplierDecision, prewarmGpu, type ApplierDecision } from '../applier'
import { loadClipImageEncoder, type ClipImageEncoder } from '../clip/load-clip'
import { decode, type DecodedImage } from '../decode/decode'
import { downsample } from '../domain/downsample'
import type { LinearImage } from '../domain/linear-image'
import { defaultSliderStack, mergeSliderStacks, type SliderStack } from '../domain/slider-stack'

const PREVIEW_MAX_SIDE = 1024
import { encodeJpeg } from '../export/encode-jpeg'
import { writeXmp } from '../export/write-xmp'
import { analyseImage } from '../heuristics/analyse'
import { autoTune } from '../heuristics/auto-tune'
import { PRESETS } from '../presets'
import { topN } from '../presets/retrieve'
import type { Preset } from '../presets/types'
import DropZone from './DropZone'
import ExportPanel from './ExportPanel'
import HistogramView from './HistogramView'
import PresetGrid from './PresetGrid'
import SliderStackUi from './SliderStack'

interface LoadedImage {
  decoded: DecodedImage
  preview: LinearImage
  fileStem: string
  baselineSliders: SliderStack
}

const stemOf = (filename: string): string => {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(0, dot) : filename
}

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const ToolBody = (): React.JSX.Element => {
  const [loaded, setLoaded] = useState<LoadedImage | null>(null)
  const [sliders, setSliders] = useState<SliderStack>(defaultSliderStack())
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<readonly Preset[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewBytes, setPreviewBytes] = useState<Uint8ClampedArray | null>(null)
  const [applierDecision, setApplierDecision] = useState<ApplierDecision | null>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const encoderRef = useRef<ClipImageEncoder | null>(null)

  useEffect(() => {
    void prewarmGpu()
  }, [])

  const renderPreview = useCallback(async (image: LinearImage, stack: SliderStack) => {
    const bytes = await apply(image, stack)
    setPreviewBytes(bytes)
    setApplierDecision(getApplierDecision())
  }, [])

  useEffect(() => {
    if (!loaded || !previewBytes) return
    const canvas = previewCanvasRef.current
    if (!canvas) return
    const { width, height } = loaded.preview
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx?.createImageData) return
    const imageData = ctx.createImageData(width, height)
    imageData.data.set(previewBytes)
    ctx.putImageData(imageData, 0, 0)
  }, [loaded, previewBytes])

  const fileToArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
    if (typeof file.arrayBuffer === 'function') return file.arrayBuffer()
    // jsdom 26 doesn't expose File.arrayBuffer; FileReader is the universal fallback.
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFile = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const buffer = await fileToArrayBuffer(file)
      const decoded = await decode({ name: file.name, buffer })
      const preview = downsample(decoded.image, PREVIEW_MAX_SIDE)
      // Analyse on the downsampled preview - box-filter preserves histogram
      // statistics so the auto-tune baseline matches what the full-res output
      // would yield, much faster.
      const analysis = analyseImage(preview)
      const baseline = autoTune(analysis)
      setLoaded({
        decoded,
        preview,
        fileStem: stemOf(file.name),
        baselineSliders: baseline,
      })
      setSliders(baseline)
      setActivePreset('Auto-tuned')
      await renderPreview(preview, baseline)
      void runSuggestions(preview)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[raw-tuner] handleFile failed:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const runSuggestions = async (image: LinearImage) => {
    try {
      if (!encoderRef.current) {
        encoderRef.current = await loadClipImageEncoder()
      }
      const embedding = await encoderRef.current.embed(image)
      const top = topN(embedding, PRESETS, 5, { mmrLambda: 0.7 })
      setSuggestions(top)
    } catch (err) {
      // Suggestions are nice-to-have; never block the workflow on failure.
      // eslint-disable-next-line no-console
      console.warn('[raw-tuner] preset suggestions failed:', err)
    }
  }

  const handleSliderChange = async (patch: SliderStack | Partial<SliderStack>) => {
    if (!loaded) return
    const next =
      'curvePoints' in patch && Array.isArray(patch.curvePoints) && 'hsl' in patch
        ? (patch as SliderStack)
        : mergeSliderStacks(sliders, patch as Partial<SliderStack>)
    setSliders(next)
    setActivePreset(null)
    await renderPreview(loaded.preview, next)
  }

  const handlePresetSelect = async (preset: Preset) => {
    if (!loaded) return
    const merged = mergeSliderStacks(loaded.baselineSliders, preset.sliders)
    setSliders(merged)
    setActivePreset(preset.name)
    await renderPreview(loaded.preview, merged)
  }

  const handleAutoTune = async () => {
    if (!loaded) return
    setSliders(loaded.baselineSliders)
    setActivePreset('Auto-tuned')
    await renderPreview(loaded.preview, loaded.baselineSliders)
  }

  const handleExportJpeg = async (quality: number) => {
    if (!loaded) return
    const fullBytes = await apply(loaded.decoded.image, sliders)
    const blob = await encodeJpeg(
      loaded.decoded.image.width,
      loaded.decoded.image.height,
      fullBytes,
      {
        quality,
      },
    )
    downloadBlob(blob, `${loaded.fileStem}.jpg`)
  }

  const handleExportXmp = (): void => {
    if (!loaded) return
    const xml = writeXmp(sliders)
    downloadBlob(new Blob([xml], { type: 'application/rdf+xml' }), `${loaded.fileStem}.xmp`)
  }

  const cameraLabel = loaded
    ? [loaded.decoded.metadata.cameraMake, loaded.decoded.metadata.cameraModel]
        .filter(Boolean)
        .join(' ')
    : ''

  const presetButtons: readonly Preset[] = loaded
    ? [
        {
          name: 'Auto-tuned',
          description: 'Heuristic auto-tune',
          sliders: loaded.baselineSliders,
          embedding: [],
        },
        ...suggestions,
      ]
    : []

  return (
    <div className="space-y-4">
      {!loaded && <DropZone onFile={(file) => void handleFile(file)} />}
      {error && (
        <div
          role="alert"
          className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200"
        >
          {error}
        </div>
      )}
      {busy && <p className="text-sm text-gray-500">Processing...</p>}
      {loaded && (
        <>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Loaded {loaded.fileStem}
            {cameraLabel ? ` - ${cameraLabel}` : ''}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <canvas
              ref={previewCanvasRef}
              aria-label="Preview"
              className="w-full rounded border border-gray-200 dark:border-gray-700"
            />
            <div className="space-y-4">
              <HistogramView image={loaded.preview} width={256} height={120} />
              <button
                type="button"
                onClick={() => void handleAutoTune()}
                className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:border-pink hover:text-pink dark:border-gray-700 dark:text-gray-300"
              >
                Reset to auto-tune
              </button>
              <SliderStackUi value={sliders} onChange={(p) => void handleSliderChange(p)} />
            </div>
          </div>
          <PresetGrid
            presets={presetButtons}
            active={activePreset}
            onSelect={(p) => void handlePresetSelect(p)}
          />
          <ExportPanel
            disabled={!loaded || busy}
            onExportJpeg={(q) => void handleExportJpeg(q)}
            onExportXmp={handleExportXmp}
          />
        </>
      )}
      {!loaded && (
        <p className="m-0 text-sm text-gray-500 dark:text-gray-400">
          Drop a photo to see suggested looks.
        </p>
      )}
      {applierDecision && (
        <p className="m-0 text-xs text-gray-400 dark:text-gray-500" data-testid="applier-decision">
          {applierDecision === 'gpu' ? 'Rendering on the GPU' : 'Rendering on the CPU'}
        </p>
      )}
    </div>
  )
}

export default ToolBody
