import { describe, it, expect, vi } from 'vitest'
import type { LoadContext } from '@docusaurus/types'
import type { PluginContentLoadedActions } from '@docusaurus/types'
import frontmatterImageProcessorPlugin from './frontmatter-image-processor'

describe('frontmatterImageProcessorPlugin', () => {
  const mockContext = {
    siteDir: '/test/site',
    generatedFilesDir: '/test/site/.docusaurus',
    siteConfig: {},
    globalData: {},
    i18n: {},
    baseUrl: '/',
    outDir: '/test/site/build',
  } as unknown as LoadContext

  it('creates a plugin with correct name', () => {
    const plugin = frontmatterImageProcessorPlugin(mockContext)
    expect(plugin.name).toBe('frontmatter-image-processor')
  })

  it('has loadContent method', () => {
    const plugin = frontmatterImageProcessorPlugin(mockContext)
    expect(plugin.loadContent).toBeDefined()
    expect(typeof plugin.loadContent).toBe('function')
  })

  it('has contentLoaded method', () => {
    const plugin = frontmatterImageProcessorPlugin(mockContext)
    expect(plugin.contentLoaded).toBeDefined()
    expect(typeof plugin.contentLoaded).toBe('function')
  })

  describe('contentLoaded', () => {
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

      const mockActions = {
        setGlobalData: vi.fn(),
      }

      const plugin = frontmatterImageProcessorPlugin(mockContext)
      await plugin.contentLoaded!({
        content: mockManifest,
        actions: mockActions as unknown as PluginContentLoadedActions,
      })

      expect(mockActions.setGlobalData).toHaveBeenCalledWith(mockManifest)
    })
  })
})
