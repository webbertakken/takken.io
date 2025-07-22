import React from 'react'

interface OptimizedThumbnailProps {
  imageUrl: string
  title: string
  className?: string
}

function optimizeImageUrl(url: string): string {
  // For Unsplash images, add size parameters for better optimization
  if (url.includes('images.unsplash.com')) {
    // Remove existing size parameters and add optimized ones for thumbnails
    const baseUrl = url.split('?')[0]
    return `${baseUrl}?w=256&auto=format&q=80`
  }

  // For local images or other sources, return as-is
  return url
}

export default function OptimizedThumbnail({
  imageUrl,
  title,
  className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-200',
}: OptimizedThumbnailProps): JSX.Element {
  const optimizedUrl = optimizeImageUrl(imageUrl)

  return <img src={optimizedUrl} alt={title} className={className} loading="lazy" />
}
