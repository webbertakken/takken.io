import { renderHook } from '@testing-library/react'
import { useProcessedImage } from './useProcessedImage'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePluginData } from '@docusaurus/useGlobalData'

vi.mock('@docusaurus/useGlobalData')

describe('useProcessedImage', () => {
  const mockManifest = {
    'growth-mindset': {
      src: '/assets/mindset/growth-mindset.webp',
      processed: {
        thumbnail: '/assets/processed/mindset/growth-mindset-thumbnail-abc123.webp',
        medium: '/assets/processed/mindset/growth-mindset-medium-abc123.webp',
        large: '/assets/processed/mindset/growth-mindset-large-abc123.webp',
        original: '/assets/processed/mindset/growth-mindset-original-abc123.webp',
      },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns processed image data when available in manifest', () => {
    vi.mocked(usePluginData).mockReturnValue(mockManifest)

    const { result } = renderHook(() =>
      useProcessedImage('/assets/mindset/growth-mindset.webp', 'growth-mindset'),
    )

    expect(result.current).toEqual(mockManifest['growth-mindset'])
  })

  it('returns fallback data when image not in manifest', () => {
    vi.mocked(usePluginData).mockReturnValue(mockManifest)

    const imageUrl = '/some/other/image.jpg'
    const { result } = renderHook(() => useProcessedImage(imageUrl, 'unknown-slug'))

    expect(result.current).toEqual({
      src: imageUrl,
      processed: {
        thumbnail: imageUrl,
        medium: imageUrl,
        large: imageUrl,
        original: imageUrl,
      },
    })
  })

  it('returns null when no manifest available', () => {
    vi.mocked(usePluginData).mockReturnValue(undefined)

    const { result } = renderHook(() => useProcessedImage('/any/image.jpg', 'any-slug'))

    expect(result.current).toBeNull()
  })

  it('returns null when no image provided', () => {
    vi.mocked(usePluginData).mockReturnValue(mockManifest)

    const { result } = renderHook(() => useProcessedImage(undefined, 'growth-mindset'))

    expect(result.current).toBeNull()
  })

  it('handles mismatched src gracefully', () => {
    vi.mocked(usePluginData).mockReturnValue(mockManifest)

    const differentUrl = '/different/image.jpg'
    const { result } = renderHook(() => useProcessedImage(differentUrl, 'growth-mindset'))

    // Should return fallback since src doesn't match
    expect(result.current).toEqual({
      src: differentUrl,
      processed: {
        thumbnail: differentUrl,
        medium: differentUrl,
        large: differentUrl,
        original: differentUrl,
      },
    })
  })
})
