import { usePluginData } from '@docusaurus/useGlobalData'
import type { ProcessedImageData } from '../../../plugins/frontmatter-image-processor'

interface ImageManifest {
  [slug: string]: ProcessedImageData
}

export function useProcessedImage(
  imageSrc: string | undefined,
  postSlug: string,
): ProcessedImageData | null {
  const manifest = usePluginData('frontmatter-image-processor') as ImageManifest | undefined

  if (!manifest || !imageSrc) {
    return null
  }

  // Extract slug from the post metadata or URL
  const processedData = manifest[postSlug]

  if (processedData && processedData.src === imageSrc) {
    return processedData
  }

  // Fallback for images that haven't been processed
  return {
    src: imageSrc,
    processed: {
      thumbnail: imageSrc,
      medium: imageSrc,
      large: imageSrc,
      original: imageSrc,
    },
  }
}
