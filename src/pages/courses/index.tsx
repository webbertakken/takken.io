import React, { useState } from 'react'
import Layout from '@theme/Layout'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import RoadmapTrack from '@site/src/components/Roadmap/RoadmapTrack'
import RoadmapConnections from '@site/src/components/Roadmap/RoadmapConnections'
import { useWatchedVideos } from '@site/src/hooks/useWatchedVideos'
import { useAuth } from '@site/src/contexts/AuthContext'
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

type Topic = 'human' | 'developer'

const SubscribeBar = (): React.ReactElement => {
  const { user } = useAuth()
  const [email, setEmail] = useState(user?.email ?? '')
  const [topics, setTopics] = useState<Set<Topic>>(new Set(['human', 'developer']))
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Sync email when user signs in
  React.useEffect(() => {
    if (user?.email) {
      setEmail(user.email)
    }
  }, [user?.email])

  const toggleTopic = (topic: Topic): void => {
    setTopics((prev) => {
      const next = new Set(prev)
      if (next.has(topic)) {
        next.delete(topic)
      } else {
        next.add(topic)
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!email.trim() || topics.size === 0) return

    setSubmitting(true)
    try {
      const { getFirebaseFirestore } = await import('../../core/firebase')
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')

      const db = getFirebaseFirestore()
      await addDoc(collection(db, 'subscribers'), {
        email: email.trim(),
        topics: [...topics],
        subscribedAt: serverTimestamp(),
      })
      setSubmitted(true)
      toast.success('Subscribed successfully!')
    } catch (error) {
      console.error('Failed to subscribe:', error)
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mb-12 rounded-xl border border-green-200 bg-green-50 p-4 text-center text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
        You are subscribed! We will keep you posted.
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mb-12 flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900 sm:flex-row"
    >
      <span className="shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">
        Subscribe for updates
      </span>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => toggleTopic('human')}
          className={clsx(
            'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
            topics.has('human')
              ? 'bg-track-human text-white'
              : 'border border-track-human text-track-human',
          )}
        >
          Human
        </button>
        <button
          type="button"
          onClick={() => toggleTopic('developer')}
          className={clsx(
            'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
            topics.has('developer')
              ? 'bg-track-developer text-white'
              : 'border border-track-developer text-track-developer',
          )}
        >
          Developer
        </button>
      </div>

      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
      />

      <button
        type="submit"
        disabled={submitting || topics.size === 0}
        className="shrink-0 rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
      >
        {submitting ? 'Subscribing...' : 'Subscribe'}
      </button>
    </form>
  )
}

const Courses = (): React.ReactElement => {
  const { watchedIds, toggleWatched } = useWatchedVideos()

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

          <SubscribeBar />

          <div className="relative">
            <RoadmapConnections />

            <div className="grid grid-cols-1 gap-12 md:grid-cols-3 lg:gap-24">
              {tracks.map((track) => (
                <RoadmapTrack
                  key={track.id}
                  track={track}
                  watchedIds={watchedIds}
                  onToggleWatched={toggleWatched}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Courses
