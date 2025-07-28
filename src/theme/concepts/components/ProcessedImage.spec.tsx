import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ProcessedImage from './ProcessedImage'
import type { ProcessedImageData } from '../../../plugins/frontmatter-image-processor'
import { describe, it, expect, vi } from 'vitest'

// Mock the Modal component
vi.mock('../../../components/Modal/Modal', () => ({
  default: ({
    children,
    onCloseRequested,
  }: {
    children: React.ReactNode
    onCloseRequested: () => void
  }) => (
    <div data-testid="modal" onClick={onCloseRequested}>
      {children}
    </div>
  ),
}))

describe('ProcessedImage', () => {
  const mockProcessedData: ProcessedImageData = {
    src: '/original/image.jpg',
    processed: {
      thumbnail: '/processed/thumbnail.webp',
      medium: '/processed/medium.webp',
      large: '/processed/large.webp',
      original: '/processed/original.webp',
    },
  }

  it('renders thumbnail size correctly', () => {
    render(<ProcessedImage processedData={mockProcessedData} size="thumbnail" alt="Test image" />)

    const img = screen.getByAltText('Test image')
    expect(img).toHaveAttribute('src', '/processed/thumbnail.webp')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).not.toHaveClass('cursor-zoom-in')
  })

  it('renders medium size correctly', () => {
    render(<ProcessedImage processedData={mockProcessedData} size="medium" alt="Test image" />)

    const img = screen.getByAltText('Test image')
    expect(img).toHaveAttribute('src', '/processed/medium.webp')
  })

  it('renders large size correctly', () => {
    render(<ProcessedImage processedData={mockProcessedData} size="large" alt="Test image" />)

    const img = screen.getByAltText('Test image')
    expect(img).toHaveAttribute('src', '/processed/large.webp')
  })

  it('adds zoom cursor when modal is enabled', () => {
    render(
      <ProcessedImage
        processedData={mockProcessedData}
        size="medium"
        alt="Test image"
        enableModal={true}
      />,
    )

    const img = screen.getByAltText('Test image')
    expect(img).toHaveClass('cursor-zoom-in')
  })

  it('opens modal on click when enabled', () => {
    render(
      <ProcessedImage
        processedData={mockProcessedData}
        size="medium"
        alt="Test image"
        enableModal={true}
      />,
    )

    const img = screen.getByAltText('Test image')
    fireEvent.click(img)

    expect(screen.getByTestId('modal')).toBeInTheDocument()
    // Modal should show the original/large image
    const modalImg = screen.getAllByAltText('Test image')[1]
    expect(modalImg).toHaveAttribute('src', '/processed/original.webp')
  })

  it('closes modal on click', () => {
    render(
      <ProcessedImage
        processedData={mockProcessedData}
        size="medium"
        alt="Test image"
        enableModal={true}
      />,
    )

    const img = screen.getByAltText('Test image')
    fireEvent.click(img)

    const modal = screen.getByTestId('modal')
    fireEvent.click(modal)

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <ProcessedImage
        processedData={mockProcessedData}
        size="medium"
        alt="Test image"
        className="custom-class"
      />,
    )

    const img = screen.getByAltText('Test image')
    expect(img).toHaveClass('custom-class')
  })

  it('handles null processedData gracefully', () => {
    render(<ProcessedImage processedData={null} size="medium" alt="Test image" />)

    const img = screen.getByAltText('Test image')
    expect(img).toHaveAttribute('src', '')
  })

  it('falls back to src when processed size not available', () => {
    const partialData: ProcessedImageData = {
      src: '/fallback/image.jpg',
      processed: {
        thumbnail: '',
        medium: '',
        large: '',
        original: '',
      },
    }

    render(<ProcessedImage processedData={partialData} size="medium" alt="Test image" />)

    const img = screen.getByAltText('Test image')
    expect(img).toHaveAttribute('src', '/fallback/image.jpg')
  })

  it('uses large image for modal when original not available', () => {
    const dataWithoutOriginal: ProcessedImageData = {
      src: '/original/image.jpg',
      processed: {
        thumbnail: '/processed/thumbnail.webp',
        medium: '/processed/medium.webp',
        large: '/processed/large.webp',
        original: '',
      },
    }

    render(
      <ProcessedImage
        processedData={dataWithoutOriginal}
        size="medium"
        alt="Test image"
        enableModal={true}
      />,
    )

    const img = screen.getByAltText('Test image')
    fireEvent.click(img)

    const modalImg = screen.getAllByAltText('Test image')[1]
    expect(modalImg).toHaveAttribute('src', '/processed/large.webp')
  })
})
