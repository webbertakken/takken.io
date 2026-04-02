import { vi, describe, expect, it, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Track } from './types'

const mockAddDoc = vi.fn()
const mockServerTimestamp = vi.fn(() => 'mock-timestamp')
const mockCollection = vi.fn(() => 'mock-collection-ref')
const mockDb = { name: 'mock-db' }

vi.mock('../../core/firebase', () => ({
  getFirebaseFirestore: () => mockDb,
}))

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => (mockCollection as (...a: unknown[]) => unknown)(...args),
  addDoc: (...args: unknown[]) => (mockAddDoc as (...a: unknown[]) => unknown)(...args),
  serverTimestamp: () => mockServerTimestamp(),
}))

vi.mock('./RoadmapCard', () => ({
  default: ({ video, isWatched }: { video: { id: string; title: string }; isWatched: boolean }) => (
    <div data-testid={`card-${video.id}`} data-watched={isWatched}>
      {video.title}
    </div>
  ),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import RoadmapTrack from './RoadmapTrack'
import toast from 'react-hot-toast'

const track: Track = {
  id: 'human-track',
  title: 'Human Track',
  colour: 'human',
  videos: [
    {
      id: 'v1',
      title: 'Video One',
      label: 'Fundamentals',
      youtubeUrl: 'https://youtube.com/watch?v=1',
    },
    {
      id: 'v2',
      title: 'Video Two',
      label: 'Fundamentals',
      youtubeUrl: 'https://youtube.com/watch?v=2',
    },
    { id: 'v3', title: 'Planned Video', label: 'Planned' },
  ],
}

const defaultProps = {
  track,
  watchedIds: new Set<string>(),
  onToggleWatched: vi.fn(),
  onVideoEnd: vi.fn(),
}

describe('RoadmapTrack', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAddDoc.mockResolvedValue({ id: 'new-doc' })
  })

  it('renders the track title', () => {
    render(<RoadmapTrack {...defaultProps} />)

    expect(screen.getByText('Human Track')).toBeInTheDocument()
  })

  it('applies the correct text colour class to the title', () => {
    render(<RoadmapTrack {...defaultProps} />)

    const title = screen.getByText('Human Track')
    expect(title.className).toContain('text-track-human')
  })

  it('applies the correct border colour class to the title', () => {
    render(<RoadmapTrack {...defaultProps} />)

    const title = screen.getByText('Human Track')
    expect(title.className).toContain('border-track-human')
  })

  it('renders all video cards', () => {
    render(<RoadmapTrack {...defaultProps} />)

    expect(screen.getByTestId('card-v1')).toBeInTheDocument()
    expect(screen.getByTestId('card-v2')).toBeInTheDocument()
    expect(screen.getByTestId('card-v3')).toBeInTheDocument()
  })

  it('passes isWatched correctly to cards', () => {
    const watchedIds = new Set(['v1'])
    render(<RoadmapTrack {...defaultProps} watchedIds={watchedIds} />)

    expect(screen.getByTestId('card-v1')).toHaveAttribute('data-watched', 'true')
    expect(screen.getByTestId('card-v2')).toHaveAttribute('data-watched', 'false')
  })

  it('renders beforePlanned slot at the correct position', () => {
    const beforePlanned = <div data-testid="before-planned">Before Planned</div>

    const { container } = render(<RoadmapTrack {...defaultProps} beforePlanned={beforePlanned} />)

    const beforePlannedEl = screen.getByTestId('before-planned')
    expect(beforePlannedEl).toBeInTheDocument()

    // beforePlanned should appear before the planned card (v3)
    const allTestIds = Array.from(container.querySelectorAll('[data-testid]')).map((el) =>
      el.getAttribute('data-testid'),
    )
    const beforePlannedIdx = allTestIds.indexOf('before-planned')
    const plannedCardIdx = allTestIds.indexOf('card-v3')
    expect(beforePlannedIdx).toBeLessThan(plannedCardIdx)
  })

  it('does not render beforePlanned when no planned videos exist', () => {
    const trackWithoutPlanned: Track = {
      ...track,
      videos: track.videos.filter((v) => v.label !== 'Planned'),
    }
    const beforePlanned = <div data-testid="before-planned">Before Planned</div>

    render(
      <RoadmapTrack {...defaultProps} track={trackWithoutPlanned} beforePlanned={beforePlanned} />,
    )

    // findIndex returns -1 when none planned, so beforePlanned renders at index -1 which never matches
    expect(screen.queryByTestId('before-planned')).not.toBeInTheDocument()
  })

  describe('SuggestTopic', () => {
    it('renders the suggestion form', () => {
      render(<RoadmapTrack {...defaultProps} />)

      expect(screen.getByPlaceholderText('Suggest a topic...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('submits a suggestion to Firestore', async () => {
      render(<RoadmapTrack {...defaultProps} />)

      const input = screen.getByPlaceholderText('Suggest a topic...')
      const submitButton = screen.getByRole('button', { name: /send/i })

      fireEvent.change(input, { target: { value: 'Machine learning basics' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockCollection).toHaveBeenCalledWith(mockDb, 'suggestions')
        expect(mockAddDoc).toHaveBeenCalledWith('mock-collection-ref', {
          track: 'human',
          topic: 'Machine learning basics',
          createdAt: 'mock-timestamp',
        })
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Thanks for the suggestion!')
      })
    })

    it('disables the submit button when input is empty', () => {
      render(<RoadmapTrack {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /send/i })
      expect(submitButton).toBeDisabled()
    })

    it('does not submit when input is whitespace only', async () => {
      render(<RoadmapTrack {...defaultProps} />)

      const input = screen.getByPlaceholderText('Suggest a topic...')
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.submit(input.closest('form')!)

      // Should not have called addDoc
      expect(mockAddDoc).not.toHaveBeenCalled()
    })

    it('clears the input after successful submission', async () => {
      render(<RoadmapTrack {...defaultProps} />)

      const input = screen.getByPlaceholderText('Suggest a topic...') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'Test topic' } })
      fireEvent.click(screen.getByRole('button', { name: /send/i }))

      await waitFor(() => {
        expect(input.value).toBe('')
      })
    })

    it('shows error toast when submission fails', async () => {
      mockAddDoc.mockRejectedValueOnce(new Error('Network error'))

      render(<RoadmapTrack {...defaultProps} />)

      const input = screen.getByPlaceholderText('Suggest a topic...')
      fireEvent.change(input, { target: { value: 'Failing topic' } })
      fireEvent.click(screen.getByRole('button', { name: /send/i }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to submit. Please try again.')
      })
    })
  })
})
