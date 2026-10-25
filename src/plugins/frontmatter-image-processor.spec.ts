import type { LoadContext } from '@docusaurus/types'
import type { PluginContentLoadedActions } from '@docusaurus/types'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import frontmatterImageProcessorPlugin from './frontmatter-image-processor'
import type { ProcessedImageData } from './frontmatter-image-processor'

const fetchMock = vi.hoisted(() => vi.fn())
vi.mock('node-fetch', () => ({ default: fetchMock }))

const createPng = (): Promise<Buffer> =>
  sharp({ create: { width: 4, height: 4, channels: 3, background: '#e011c1' } })
    .png()
    .toBuffer()

const post = (image?: string): string =>
  ['---', 'title: A post', ...(image ? [`image: ${image}`] : []), '---', '', 'Body'].join('\n')

describe('frontmatterImageProcessorPlugin', () => {
  let siteDir: string

  const contextFor = (dir: string) => ({ siteDir: dir }) as unknown as LoadContext
  const outputDir = () => path.join(siteDir, 'static', 'assets', 'processed', 'mindset')
  const readManifest = async (): Promise<Record<string, ProcessedImageData>> =>
    JSON.parse(
      await fs.readFile(
        path.join(siteDir, '.docusaurus/frontmatter-images-manifest.json'),
        'utf-8',
      ),
    )

  beforeEach(async () => {
    siteDir = await fs.mkdtemp(path.join(os.tmpdir(), 'frontmatter-images-'))
    await fs.mkdir(path.join(siteDir, 'mindset'))
    await fs.mkdir(path.join(siteDir, 'static', 'img'), { recursive: true })
    vi.spyOn(process, 'cwd').mockReturnValue(siteDir)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    fetchMock.mockReset()
    await fs.rm(siteDir, { recursive: true, force: true })
  })

  it('creates a plugin with correct name', () => {
    const plugin = frontmatterImageProcessorPlugin(contextFor('/test/site'))
    expect(plugin.name).toBe('frontmatter-image-processor')
  })

  it('watches the mindset markdown files', () => {
    const plugin = frontmatterImageProcessorPlugin(contextFor('/test/site'))
    expect(plugin.getPathsToWatch!()).toEqual(['/test/site/mindset/**/*.md'])
  })

  it('handles a local image by writing every size as webp and recording it in the manifest', async () => {
    await fs.writeFile(path.join(siteDir, 'static', 'img', 'calm.png'), await createPng())
    await fs.writeFile(path.join(siteDir, 'mindset', '010-calm-mind.md'), post('/img/calm.png'))

    const manifest = await frontmatterImageProcessorPlugin(contextFor(siteDir)).loadContent!()

    const entry = (manifest as Record<string, ProcessedImageData>)['calm-mind']
    expect(entry.src).toBe('/img/calm.png')
    const publicPaths = Object.values(entry.processed)
    expect(publicPaths).toHaveLength(4)
    for (const publicPath of publicPaths) {
      expect(publicPath).toMatch(
        /^\/assets\/processed\/mindset\/calm-mind-[a-z]+-[0-9a-f]{8}\.webp$/,
      )
      await expect(fs.access(path.join(outputDir(), path.basename(publicPath)))).resolves.toBe(
        undefined,
      )
    }
    expect(await readManifest()).toEqual(manifest)
  })

  it('handles already processed images by keeping the existing files', async () => {
    await fs.writeFile(path.join(siteDir, 'static', 'img', 'calm.png'), await createPng())
    await fs.writeFile(path.join(siteDir, 'mindset', '010-calm-mind.md'), post('img/calm.png'))
    const plugin = frontmatterImageProcessorPlugin(contextFor(siteDir))
    await plugin.loadContent!()
    const firstRun = await fs.readdir(outputDir())
    const mtimes = await Promise.all(
      firstRun.map(async (file) => (await fs.stat(path.join(outputDir(), file))).mtimeMs),
    )

    await plugin.loadContent!()

    expect(await fs.readdir(outputDir())).toEqual(firstRun)
    const mtimesAfter = await Promise.all(
      firstRun.map(async (file) => (await fs.stat(path.join(outputDir(), file))).mtimeMs),
    )
    expect(mtimesAfter).toEqual(mtimes)
  })

  it('handles remote images by downloading them', async () => {
    const png = await createPng()
    fetchMock.mockResolvedValue({
      ok: true,
      arrayBuffer: async () => png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength),
    })
    await fs.writeFile(
      path.join(siteDir, 'mindset', '020-letting-go.md'),
      post('https://example.com/letting-go.png'),
    )

    const manifest = await frontmatterImageProcessorPlugin(contextFor(siteDir)).loadContent!()

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/letting-go.png')
    expect(manifest).toHaveProperty(['letting-go', 'src'], 'https://example.com/letting-go.png')
  })

  it('handles a failed download by logging it and continuing with the other posts', async () => {
    fetchMock.mockResolvedValue({ ok: false, statusText: 'Not Found' })
    await fs.writeFile(path.join(siteDir, 'static', 'img', 'calm.png'), await createPng())
    await fs.writeFile(path.join(siteDir, 'mindset', '010-broken.md'), post('https://x.test/a.png'))
    await fs.writeFile(path.join(siteDir, 'mindset', '020-calm-mind.md'), post('/img/calm.png'))

    const manifest = await frontmatterImageProcessorPlugin(contextFor(siteDir)).loadContent!()

    expect(Object.keys(manifest as object)).toEqual(['calm-mind'])
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('010-broken.md'),
      expect.objectContaining({ message: 'Failed to download image: Not Found' }),
    )
  })

  it('handles posts without an image, without frontmatter, and non-markdown files', async () => {
    await fs.writeFile(path.join(siteDir, 'mindset', '010-no-image.md'), post())
    await fs.writeFile(path.join(siteDir, 'mindset', '020-no-frontmatter.md'), 'Just text')
    await fs.writeFile(path.join(siteDir, 'mindset', 'notes.txt'), post('/img/missing.png'))

    const manifest = await frontmatterImageProcessorPlugin(contextFor(siteDir)).loadContent!()

    expect(manifest).toEqual({})
    expect(await readManifest()).toEqual({})
    expect(console.log).toHaveBeenCalledWith(
      '🖼️  Image processing complete: 0 processed, 1 skipped',
    )
  })

  it('sets global data with the manifest', async () => {
    const mockManifest = {
      'growth-mindset': {
        src: '/assets/mindset/growth-mindset.webp',
        processed: {
          thumbnail: '/processed/thumbnail.webp',
          medium: '/processed/medium.webp',
          large: '/processed/large.webp',
          original: '/processed/original.webp',
        },
      },
    }
    const mockActions = { setGlobalData: vi.fn() }

    const plugin = frontmatterImageProcessorPlugin(contextFor('/test/site'))
    await plugin.contentLoaded!({
      content: mockManifest,
      actions: mockActions as unknown as PluginContentLoadedActions,
    })

    expect(mockActions.setGlobalData).toHaveBeenCalledWith(mockManifest)
  })
})
