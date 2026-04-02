import React, { useState } from 'react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import type { Track } from './types'
import RoadmapCard from './RoadmapCard'

const offsetClasses: Record<string, string> = {
  human: '',
  developer: 'md:mt-24',
  'deep-dive': 'md:mt-48',
}

const borderColourClasses: Record<string, string> = {
  human: 'border-track-human',
  developer: 'border-track-developer',
  'deep-dive': 'border-track-deep-dive',
}

const textColourClasses: Record<string, string> = {
  human: 'text-track-human',
  developer: 'text-track-developer',
  'deep-dive': 'text-track-deep-dive',
}

interface RoadmapTrackProps {
  track: Track
  watchedIds: Set<string>
  onToggleWatched: (videoId: string) => void
  onVideoEnd: () => void
  trackingEnabled: boolean
  beforePlanned?: React.ReactNode
}

const bgClasses: Record<string, string> = {
  human: 'bg-track-human',
  developer: 'bg-track-developer',
  'deep-dive': 'bg-track-deep-dive',
}

const SuggestTopic = ({ trackId }: { trackId: string }): React.ReactElement => {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!value.trim()) return

    setSubmitting(true)
    try {
      const { getFirebaseFirestore } = await import('../../core/firebase')
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')

      const db = getFirebaseFirestore()
      await addDoc(collection(db, 'suggestions'), {
        track: trackId,
        topic: value.trim(),
        createdAt: serverTimestamp(),
      })
      setValue('')
      toast.success('Thanks for the suggestion!')
    } catch (error) {
      console.error('Failed to submit suggestion:', error)
      toast.error('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex gap-2">
      <input
        type="text"
        placeholder="Suggest a topic..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
      />
      <button
        type="submit"
        disabled={submitting || !value.trim()}
        className={clsx(
          'w-16 shrink-0 rounded-lg py-1.5 text-center text-sm font-medium text-white transition-colors disabled:opacity-50',
          bgClasses[trackId],
        )}
      >
        {submitting ? '...' : 'Send'}
      </button>
    </form>
  )
}

const RoadmapTrack = ({
  track,
  watchedIds,
  onToggleWatched,
  onVideoEnd,
  trackingEnabled,
  beforePlanned,
}: RoadmapTrackProps): React.ReactElement => {
  const { title, colour, videos } = track
  const firstPlannedIndex = videos.findIndex((v) => v.label === 'Planned')

  return (
    <div className={clsx('flex flex-col gap-6', offsetClasses[colour])}>
      <h2
        className={clsx(
          'border-l-4 pl-4 text-xl font-semibold',
          borderColourClasses[colour],
          textColourClasses[colour],
        )}
      >
        {title}
      </h2>

      <div className="flex flex-col gap-4">
        {videos.map((video, index) => (
          <React.Fragment key={video.id}>
            {beforePlanned && index === firstPlannedIndex && beforePlanned}
            <RoadmapCard
              video={video}
              colour={colour}
              isWatched={watchedIds.has(video.id)}
              onToggleWatched={() => onToggleWatched(video.id)}
              trackingEnabled={trackingEnabled}
              onVideoEnd={onVideoEnd}
            />
          </React.Fragment>
        ))}
      </div>

      <SuggestTopic trackId={colour} />
    </div>
  )
}

export default RoadmapTrack
