import React from 'react'
import Layout from '@theme/Layout'
import RoadmapTrack from '@site/src/components/Roadmap/RoadmapTrack'
import RoadmapConnections from '@site/src/components/Roadmap/RoadmapConnections'
import type { Track } from '@site/src/components/Roadmap/types'

const tracks: Track[] = [
  {
    id: 'human',
    title: 'Human track',
    colour: 'human',
    videos: [
      { id: 'a01', title: 'Introduction', label: 'A01' },
      { id: 'a02', title: 'Getting started', label: 'A02' },
      { id: 'a03', title: 'Conversational AI', label: 'A03' },
      { id: 'a04', title: 'Agentic AI', label: 'A04' },
      { id: 'a05', title: 'Voice interface', label: 'A05' },
    ],
  },
  {
    id: 'developer',
    title: 'Developer track',
    colour: 'developer',
    videos: [
      { id: 'b01', title: 'Online prototype', label: 'B01' },
      { id: 'b02', title: 'Using tools', label: 'B02' },
      { id: 'b03', title: 'Ask to learn', label: 'B03' },
      { id: 'b04', title: 'Instruct to succeed', label: 'B04' },
      { id: 'b05', title: 'Planning tools', label: 'B05' },
      { id: 'b06', title: 'Agent teams', label: 'B06' },
      { id: 'b07', title: 'Planning phase', label: 'B07' },
      { id: 'b08', title: 'Implementation phase 1', label: 'B08' },
      { id: 'b09', title: 'Design phase', label: 'B09' },
      { id: 'b10', title: 'Implementation phase 2', label: 'B10' },
      { id: 'b11', title: 'Agentic shopping', label: 'Planned' },
      { id: 'b12', title: 'Polishing phase', label: 'Planned' },
      { id: 'b13', title: 'Quality controls', label: 'Planned' },
      { id: 'b14', title: 'Operating production', label: 'Planned' },
      { id: 'b15', title: 'Reacting to bugs', label: 'Planned' },
      { id: 'b16', title: 'Orchestrating Agents', label: 'Planned' },
    ],
  },
  {
    id: 'deep-dive',
    title: 'Deep dives',
    colour: 'deep-dive',
    videos: [
      { id: 'c01', title: 'Local models for coding', label: 'Planned' },
      { id: 'c02', title: 'Software factory', label: 'Planned' },
      { id: 'c03', title: 'Assistant orchestration', label: 'Planned' },
    ],
  },
]

const Courses = (): React.ReactElement => {
  return (
    <Layout title="Courses" description="AI courses with guided learning tracks">
      <div className="min-h-screen p-8 md:p-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-16 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">AI how to</h1>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Watch the introduction, pick the track you like, skip videos as you like.
            </p>
          </header>

          <div className="relative">
            <RoadmapConnections />

            <div className="grid grid-cols-1 gap-12 md:grid-cols-3 lg:gap-24">
              {tracks.map((track) => (
                <RoadmapTrack key={track.id} track={track} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Courses
