import React, { useCallback, useRef, useState } from 'react'
import clsx from 'clsx'
import type { TrackColour, Video } from './types'
import VideoViewer from './VideoViewer'

const glowClasses: Record<TrackColour, string> = {
  human: 'hover:shadow-[0_0_24px_rgba(59,130,246,0.4)]',
  developer: 'hover:shadow-[0_0_24px_rgba(168,85,247,0.4)]',
  'deep-dive': 'hover:shadow-[0_0_24px_rgba(249,115,22,0.4)]',
}

const gradientClasses: Record<TrackColour, string> = {
  human: 'from-track-human/40 to-track-human/15 dark:from-track-human/20 dark:to-track-human/5',
  developer:
    'from-track-developer/40 to-track-developer/15 dark:from-track-developer/20 dark:to-track-developer/5',
  'deep-dive':
    'from-track-deep-dive/40 to-track-deep-dive/15 dark:from-track-deep-dive/20 dark:to-track-deep-dive/5',
}

interface RoadmapCardProps {
  video: Video
  colour: TrackColour
  isWatched: boolean
  onToggleWatched: () => void
  onVideoEnd: () => void
  trackingEnabled: boolean
}

const extractVideoId = (url: string): string | null => {
  const match = /v=([^&]+)/.exec(url)
  return match?.[1] ?? null
}

const RoadmapCard = ({
  video,
  colour,
  isWatched,
  onToggleWatched,
  onVideoEnd,
  trackingEnabled,
}: RoadmapCardProps): React.ReactElement => {
  const { title, label, thumbnailUrl, youtubeUrl } = video
  const cardRef = useRef<HTMLDivElement>(null)
  const [viewer, setViewer] = useState<{ videoId: string; sourceRect: DOMRect } | null>(null)

  const handleToggleWatched = (e: React.MouseEvent): void => {
    e.stopPropagation()
    e.preventDefault()
    onToggleWatched()
  }

  const handleCardClick = useCallback((): void => {
    if (!youtubeUrl || !cardRef.current) return
    const videoId = extractVideoId(youtubeUrl)
    if (!videoId) return
    const rect = cardRef.current.getBoundingClientRect()
    setViewer({ videoId, sourceRect: rect })
  }, [youtubeUrl])

  const card = (
    <div
      ref={cardRef}
      role={youtubeUrl ? 'button' : undefined}
      tabIndex={youtubeUrl ? 0 : undefined}
      onClick={youtubeUrl ? handleCardClick : undefined}
      onKeyDown={
        youtubeUrl
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCardClick()
              }
            }
          : undefined
      }
      className={clsx(
        'group relative aspect-video rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900 overflow-hidden',
        'transition-all duration-200 ease-out',
        'hover:scale-[1.03]',
        glowClasses[colour],
        youtubeUrl && 'cursor-pointer',
      )}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className={clsx('absolute inset-0 bg-gradient-to-br', gradientClasses[colour])} />
      )}

      {/* Play button on hover for videos */}
      {youtubeUrl && !isWatched && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
            <svg className="ml-1 h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Unwatched: simple checkbox on hover */}
      {trackingEnabled && !isWatched && (
        <button
          type="button"
          onClick={handleToggleWatched}
          className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/50 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          aria-label="Mark as watched"
        />
      )}

      {trackingEnabled && isWatched && (
        <div
          className={clsx(
            'absolute inset-0 flex flex-col items-center justify-center',
            'bg-track-success/30 dark:bg-black/60',
            'backdrop-blur-sm group-hover:backdrop-blur-0',
            'transition-all duration-300 ease-out',
          )}
        >
          {/* Animated checkmark: centred at rest, flies to top-right on hover */}
          <button
            type="button"
            onClick={handleToggleWatched}
            className={clsx(
              'absolute z-10 flex items-center justify-center rounded-full',
              'border-2 border-track-success bg-track-success/20',
              'group-hover:border-transparent group-hover:bg-track-success',
              'transition-all duration-300 ease-out',
              'top-[calc(40%-1.5rem)] left-[calc(50%-1.5rem)] h-12 w-12',
              'group-hover:top-2 group-hover:left-[calc(100%-2rem)] group-hover:h-6 group-hover:w-6',
            )}
            aria-label="Mark as unwatched"
          >
            <svg
              className="h-6 w-6 text-track-success transition-all duration-300 ease-out group-hover:h-3.5 group-hover:w-3.5 group-hover:text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <span className="mt-14 text-sm font-semibold text-track-success opacity-100 transition-opacity duration-300 group-hover:opacity-0">
            Completed
          </span>
        </div>
      )}

      <div
        className={clsx(
          'absolute bottom-0 left-0 right-0 flex flex-col items-start bg-gradient-to-t from-white/70 dark:from-black/60 to-transparent p-4 transition-opacity duration-300',
          isWatched && 'opacity-50 group-hover:opacity-100',
        )}
      >
        <span
          className={clsx(
            'inline-block rounded-md bg-black/50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm',
            {
              'text-track-human': colour === 'human',
              'text-track-developer': colour === 'developer',
              'text-track-deep-dive': colour === 'deep-dive',
            },
          )}
        >
          {label}
        </span>
        <h3 className="mt-1 inline-block rounded-md bg-black/50 px-2 py-0.5 text-sm font-medium text-white backdrop-blur-sm">
          {title}
        </h3>
      </div>
    </div>
  )

  return (
    <>
      {card}
      {viewer && (
        <VideoViewer
          videoId={viewer.videoId}
          sourceRect={viewer.sourceRect}
          onClose={() => setViewer(null)}
          onVideoEnd={() => {
            if (!isWatched) onToggleWatched()
            onVideoEnd()
          }}
        />
      )}
    </>
  )
}

export default RoadmapCard
