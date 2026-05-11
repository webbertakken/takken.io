import { useEffect, useRef } from 'react'
import { histogram, HISTOGRAM_BUCKETS } from '../domain/histogram'
import type { LinearImage } from '../domain/linear-image'

interface Props {
  image: LinearImage | null
  width: number
  height: number
}

interface ChannelStyle {
  channel: 'r' | 'g' | 'b'
  fill: string
}

const CHANNEL_STYLES: readonly ChannelStyle[] = [
  { channel: 'r', fill: '#ef4444' },
  { channel: 'g', fill: '#22c55e' },
  { channel: 'b', fill: '#3b82f6' },
]

const draw = (
  ctx: CanvasRenderingContext2D,
  image: LinearImage | null,
  width: number,
  height: number,
): void => {
  ctx.clearRect(0, 0, width, height)
  if (!image) return

  const bucketWidth = width / HISTOGRAM_BUCKETS

  let maxCount = 0
  const series: Uint32Array[] = []
  for (const { channel } of CHANNEL_STYLES) {
    const hist = histogram(image, channel)
    series.push(hist)
    for (let i = 0; i < hist.length; i++) {
      if (hist[i] > maxCount) maxCount = hist[i]
    }
  }
  if (maxCount === 0) return

  ctx.globalAlpha = 0.55
  for (let s = 0; s < series.length; s++) {
    ctx.fillStyle = CHANNEL_STYLES[s].fill
    const hist = series[s]
    for (let i = 0; i < hist.length; i++) {
      const barHeight = (hist[i] / maxCount) * height
      ctx.fillRect(i * bucketWidth, height - barHeight, Math.max(1, bucketWidth), barHeight)
    }
  }
  ctx.globalAlpha = 1
}

const HistogramView = ({ image, width, height }: Props): React.JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    draw(ctx, image, width, height)
  }, [image, width, height])

  return (
    <canvas
      ref={canvasRef}
      aria-label="Histogram"
      role="img"
      width={width}
      height={height}
      className="rounded border border-gray-200 bg-gray-900 dark:border-gray-700"
    />
  )
}

export default HistogramView
