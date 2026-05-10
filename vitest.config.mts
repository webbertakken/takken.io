import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vitest/config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@site': path.resolve(dirname),
      '@docusaurus/useGlobalData': path.resolve(dirname, './src/test/mocks/docusaurus.ts'),
      '@docusaurus/Link': path.resolve(dirname, './src/test/mocks/docusaurus-link.tsx'),
      '@theme/ToolPage/ToolPage': path.resolve(dirname, './src/test/mocks/tool-page.tsx'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Exclude post-build tests from regular test runs
    exclude: ['**/node_modules/**', '**/tests/post-build/**'],
    coverage: {
      provider: 'v8',
      reporter: ['html', 'lcov', 'clover'],
    },
  },
})
