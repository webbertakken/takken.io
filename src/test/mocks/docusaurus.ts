import { vi } from 'vitest'

// Mock implementation of usePluginData
export const usePluginData = vi.fn(() => ({}))

// Export other Docusaurus hooks as needed
export const useDocusaurusContext = vi.fn(() => ({
  siteConfig: {},
  siteMetadata: {},
  globalData: {},
  i18n: {},
  codeTranslations: {},
}))
