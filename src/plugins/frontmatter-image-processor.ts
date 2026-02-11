import type { LoadContext, Plugin } from '@docusaurus/types'
import { promises as fs } from 'node:fs'
import path from 'path'
import sharp from 'sharp'
import crypto from 'crypto'
import fetch from 'node-fetch'

export interface ProcessedImageData {
  src: string
  processed: {
    thumbnail: string
    medium: string
    large: string
    original: string
  }
}

interface ImageSize {
  name: string
  width: number
}

const IMAGE_SIZES: ImageSize[] = [
  { name: 'thumbnail', width: 226 },
  { name: 'medium', width: 896 },
  { name: 'large', width: 1600 },
]

const IMAGE_MANIFEST_PATH = '.docusaurus/frontmatter-images-manifest.json'

interface ImageManifest {
  [slug: string]: ProcessedImageData
}

function getImageHash(content: Buffer): string {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 8)
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch {
    // Directory might already exist, which is fine
  }
}

async function processImage(
  imagePath: string,
  outputDir: string,
  slug: string,
  isUrl: boolean,
): Promise<ProcessedImageData> {
  // Get image content
  let imageBuffer: Buffer
  const originalSrc = imagePath

  if (isUrl) {
    console.log(`Downloading image from: ${imagePath}`)
    imageBuffer = await downloadImage(imagePath)
  } else {
    // For local images, resolve path relative to static directory
    const staticPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath
    const fullPath = path.join(process.cwd(), 'static', staticPath)
    imageBuffer = await fs.readFile(fullPath)
  }

  // Create hash for cache busting
  const hash = getImageHash(imageBuffer)
  const processedImages: ProcessedImageData['processed'] = {
    thumbnail: '',
    medium: '',
    large: '',
    original: '',
  }

  // Ensure output directory exists
  await ensureDir(outputDir)

  // Process each size
  for (const size of IMAGE_SIZES) {
    const outputFilename = `${slug}-${size.name}-${hash}.webp`
    const outputPath = path.join(outputDir, outputFilename)
    const publicPath = `/assets/processed/mindset/${outputFilename}`

    // Check if processed image already exists
    try {
      await fs.access(outputPath)
      console.log(`Skipping ${size.name} (already exists): ${outputFilename}`)
    } catch {
      // File doesn't exist, process it
      console.log(`Processing ${size.name}: ${outputFilename}`)
      await sharp(imageBuffer)
        .resize(size.width, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
        .webp({ quality: 85 })
        .toFile(outputPath)
    }

    processedImages[size.name as keyof typeof processedImages] = publicPath
  }

  // Save original as WebP too
  const originalFilename = `${slug}-original-${hash}.webp`
  const originalPath = path.join(outputDir, originalFilename)
  const originalPublicPath = `/assets/processed/mindset/${originalFilename}`

  try {
    await fs.access(originalPath)
    console.log(`Skipping original (already exists): ${originalFilename}`)
  } catch {
    console.log(`Processing original: ${originalFilename}`)
    await sharp(imageBuffer).webp({ quality: 90 }).toFile(originalPath)
  }

  processedImages.original = originalPublicPath

  return {
    src: originalSrc,
    processed: processedImages,
  }
}

async function loadManifest(manifestPath: string): Promise<ImageManifest> {
  try {
    const content = await fs.readFile(manifestPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

async function saveManifest(manifestPath: string, manifest: ImageManifest): Promise<void> {
  const dir = path.dirname(manifestPath)
  await ensureDir(dir)
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
}

export default function frontmatterImageProcessorPlugin(context: LoadContext): Plugin {
  const manifestPath = path.join(context.siteDir, IMAGE_MANIFEST_PATH)
  const mindsetDir = path.join(context.siteDir, 'mindset')

  return {
    name: 'frontmatter-image-processor',

    async loadContent() {
      console.log('🖼️  Processing frontmatter images...')

      const outputDir = path.join(context.siteDir, 'static', 'assets', 'processed', 'mindset')
      const manifest: ImageManifest = await loadManifest(manifestPath)

      // Process mindset blog posts
      const files = await fs.readdir(mindsetDir)
      const mdFiles = files.filter((file) => file.endsWith('.md'))

      let processedCount = 0
      let skippedCount = 0

      for (const file of mdFiles) {
        const filePath = path.join(mindsetDir, file)
        const content = await fs.readFile(filePath, 'utf-8')

        // Extract frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
        if (!frontmatterMatch) continue

        const frontmatter = frontmatterMatch[1]
        const imageMatch = frontmatter.match(/^image:\s*(.+)$/m)

        if (imageMatch) {
          const imagePath = imageMatch[1].trim()
          const slug = file.replace(/^\d+-/, '').replace(/\.md$/, '')

          // Check if it's a URL or local path
          const isUrl = imagePath.startsWith('http://') || imagePath.startsWith('https://')

          try {
            const processedData = await processImage(imagePath, outputDir, slug, isUrl)
            manifest[slug] = processedData
            processedCount++
            console.log(`✅ Processed images for: ${file}`)
          } catch (error) {
            console.error(`❌ Error processing image for ${file}:`, error)
          }
        } else {
          skippedCount++
        }
      }

      // Save the manifest
      await saveManifest(manifestPath, manifest)

      console.log(
        `🖼️  Image processing complete: ${processedCount} processed, ${skippedCount} skipped`,
      )

      // Return the manifest data for use in other plugins
      return manifest
    },

    async contentLoaded({ content, actions }) {
      const { setGlobalData } = actions
      // Make the manifest available globally
      setGlobalData(content)
    },

    // Add getPathsToWatch to enable hot-reload for mindset articles
    getPathsToWatch() {
      // Watch all markdown files in the mindset directory
      return [`${mindsetDir}/**/*.md`]
    },
  }
}
