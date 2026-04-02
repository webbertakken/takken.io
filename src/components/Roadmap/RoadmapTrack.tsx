import React from 'react'
import clsx from 'clsx'
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
  beforePlanned?: React.ReactNode
}

const RoadmapTrack = ({
  track,
  watchedIds,
  onToggleWatched,
  onVideoEnd,
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
              onVideoEnd={onVideoEnd}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default RoadmapTrack
