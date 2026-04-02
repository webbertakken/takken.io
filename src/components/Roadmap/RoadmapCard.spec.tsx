import { vi, describe, expect, it, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Video, TrackColour } from './types'

vi.mock('./VideoViewer', () => ({
  default: ({
    videoId,
    onClose,
    onVideoEnd,
  }: {
    videoId: string
    onClose: () => void
    onVideoEnd?: () => void
  }) => (
    <div data-testid="video-viewer" data-video-id={videoId}>
      <button onClick={onClose}>Close</button>
      <button onClick={onVideoEnd}>EndVideo</button>
    </div>
  ),
}))

import RoadmapCard from './RoadmapCard'

const baseVideo: Video = {
  id: 'vid-1',
  title: 'Test Video',
  label: 'Fundamentals',
  thumbnailUrl: 'https://example.com/thumb.jpg',
  youtubeUrl: 'https://www.youtube.com/watch?v=abc123',
}

const defaultProps = {
  video: baseVideo,
  colour: 'human' as TrackColour,
  isWatched: false,
  onToggleWatched: vi.fn(),
  onVideoEnd: vi.fn(),
}

describe('RoadmapCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('normal video card', () => {
    it('renders the thumbnail image', () => {
      render(<RoadmapCard {...defaultProps} />)

      const img = screen.getByAltText('Test Video')
      expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg')
    })

    it('renders the title and label', () => {
      render(<RoadmapCard {...defaultProps} />)

      expect(screen.getByText('Test Video')).toBeInTheDocument()
      expect(screen.getByText('Fundamentals')).toBeInTheDocument()
    })

    it('has cursor-pointer class when youtubeUrl is present', () => {
      render(<RoadmapCard {...defaultProps} />)

      const button = screen.getByRole('button', { name: /test video/i })
      expect(button.className).toContain('cursor-pointer')
    })

    it('has role="button" when youtubeUrl is present', () => {
      render(<RoadmapCard {...defaultProps} />)

      expect(screen.getByRole('button', { name: /test video/i })).toBeInTheDocument()
    })

    it('does not have role="button" when no youtubeUrl', () => {
      const video = { ...baseVideo, youtubeUrl: undefined }
      render(<RoadmapCard {...defaultProps} video={video} />)

      expect(screen.queryByRole('button', { name: /test video/i })).not.toBeInTheDocument()
    })

    it('renders gradient fallback when no thumbnailUrl', () => {
      const video = { ...baseVideo, thumbnailUrl: undefined }
      const { container } = render(<RoadmapCard {...defaultProps} video={video} />)

      // Should have gradient div instead of img
      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      expect(container.querySelector('.bg-gradient-to-br')).toBeInTheDocument()
    })
  })

  describe('play button', () => {
    it('shows play button overlay for unwatched video cards', () => {
      const { container } = render(<RoadmapCard {...defaultProps} />)

      // The play SVG path is inside a container that shows on hover
      const playSvg = container.querySelector('svg path[d="M8 5v14l11-7z"]')
      expect(playSvg).toBeInTheDocument()
    })

    it('does not show play button overlay when card is watched', () => {
      const { container } = render(<RoadmapCard {...defaultProps} isWatched={true} />)

      const playSvg = container.querySelector('svg path[d="M8 5v14l11-7z"]')
      expect(playSvg).not.toBeInTheDocument()
    })
  })

  describe('watched state', () => {
    it('shows watched overlay with completed text when isWatched is true', () => {
      render(<RoadmapCard {...defaultProps} isWatched={true} />)

      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('shows mark as unwatched button when watched', () => {
      render(<RoadmapCard {...defaultProps} isWatched={true} />)

      expect(screen.getByLabelText('Mark as unwatched')).toBeInTheDocument()
    })

    it('shows mark as watched button on hover when unwatched', () => {
      render(<RoadmapCard {...defaultProps} isWatched={false} />)

      expect(screen.getByLabelText('Mark as watched')).toBeInTheDocument()
    })

    it('calls onToggleWatched when checkbox is clicked', () => {
      render(<RoadmapCard {...defaultProps} isWatched={false} />)

      fireEvent.click(screen.getByLabelText('Mark as watched'))

      expect(defaultProps.onToggleWatched).toHaveBeenCalledTimes(1)
    })

    it('calls onToggleWatched when unwatched button is clicked', () => {
      render(<RoadmapCard {...defaultProps} isWatched={true} />)

      fireEvent.click(screen.getByLabelText('Mark as unwatched'))

      expect(defaultProps.onToggleWatched).toHaveBeenCalledTimes(1)
    })
  })

  describe('VideoViewer', () => {
    it('opens VideoViewer when card is clicked', () => {
      // Mock getBoundingClientRect
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        top: 100,
        left: 200,
        width: 300,
        height: 200,
        bottom: 300,
        right: 500,
        x: 200,
        y: 100,
        toJSON: vi.fn(),
      }))

      render(<RoadmapCard {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /test video/i }))

      expect(screen.getByTestId('video-viewer')).toBeInTheDocument()
      expect(screen.getByTestId('video-viewer')).toHaveAttribute('data-video-id', 'abc123')
    })

    it('closes VideoViewer when onClose is called', () => {
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        top: 0,
        left: 0,
        width: 300,
        height: 200,
        bottom: 200,
        right: 300,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }))

      render(<RoadmapCard {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /test video/i }))
      expect(screen.getByTestId('video-viewer')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Close'))
      expect(screen.queryByTestId('video-viewer')).not.toBeInTheDocument()
    })

    it('marks unwatched video as watched when video ends', () => {
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        top: 0,
        left: 0,
        width: 300,
        height: 200,
        bottom: 200,
        right: 300,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }))

      render(<RoadmapCard {...defaultProps} isWatched={false} />)

      fireEvent.click(screen.getByRole('button', { name: /test video/i }))
      fireEvent.click(screen.getByText('EndVideo'))

      expect(defaultProps.onToggleWatched).toHaveBeenCalledTimes(1)
      expect(defaultProps.onVideoEnd).toHaveBeenCalledTimes(1)
    })

    it('does not toggle watched when already watched and video ends', () => {
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        top: 0,
        left: 0,
        width: 300,
        height: 200,
        bottom: 200,
        right: 300,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }))

      render(<RoadmapCard {...defaultProps} isWatched={true} />)

      fireEvent.click(screen.getByRole('button', { name: /test video/i }))
      fireEvent.click(screen.getByText('EndVideo'))

      expect(defaultProps.onToggleWatched).not.toHaveBeenCalled()
      expect(defaultProps.onVideoEnd).toHaveBeenCalledTimes(1)
    })
  })

  describe('planned card', () => {
    it('renders planned layout with Future label', () => {
      const video: Video = { id: 'p-1', title: 'Future Topic', label: 'Planned' }
      render(<RoadmapCard {...defaultProps} video={video} />)

      expect(screen.getByText('Future')).toBeInTheDocument()
      expect(screen.getByText('Planned')).toBeInTheDocument()
      expect(screen.getByText('Future Topic')).toBeInTheDocument()
    })

    it('does not show play button or watched overlay for planned cards', () => {
      const video: Video = { id: 'p-1', title: 'Future Topic', label: 'Planned' }
      const { container } = render(<RoadmapCard {...defaultProps} video={video} />)

      expect(container.querySelector('svg path[d="M8 5v14l11-7z"]')).not.toBeInTheDocument()
      expect(screen.queryByText('Completed')).not.toBeInTheDocument()
    })
  })

  describe('coming soon card', () => {
    it('renders coming soon layout when no youtubeUrl and not planned', () => {
      const video: Video = { id: 'cs-1', title: 'Upcoming Topic', label: 'Advanced' }
      render(<RoadmapCard {...defaultProps} video={video} />)

      expect(screen.getByText('Next phase')).toBeInTheDocument()
      expect(screen.getByText('Coming soon')).toBeInTheDocument()
      expect(screen.getByText('Upcoming Topic')).toBeInTheDocument()
    })
  })

  describe('keyboard interaction', () => {
    it('opens VideoViewer on Enter key press', () => {
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        top: 0,
        left: 0,
        width: 300,
        height: 200,
        bottom: 200,
        right: 300,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }))

      render(<RoadmapCard {...defaultProps} />)

      fireEvent.keyDown(screen.getByRole('button', { name: /test video/i }), {
        key: 'Enter',
      })

      expect(screen.getByTestId('video-viewer')).toBeInTheDocument()
    })

    it('opens VideoViewer on Space key press', () => {
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        top: 0,
        left: 0,
        width: 300,
        height: 200,
        bottom: 200,
        right: 300,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
      }))

      render(<RoadmapCard {...defaultProps} />)

      fireEvent.keyDown(screen.getByRole('button', { name: /test video/i }), {
        key: ' ',
      })

      expect(screen.getByTestId('video-viewer')).toBeInTheDocument()
    })
  })
})
