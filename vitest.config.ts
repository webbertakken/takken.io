import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      // More specific aliases must precede the general `@site` prefix alias.
      '@site/src/theme/IdealImage': path.resolve(__dirname, './src/test/mocks/ideal-image.tsx'),
      '@site': path.resolve(__dirname),
      '@docusaurus/useGlobalData': path.resolve(__dirname, './src/test/mocks/docusaurus.ts'),
      '@docusaurus/Link': path.resolve(__dirname, './src/test/mocks/docusaurus-link.tsx'),
      '@theme/ToolPage/ToolPage': path.resolve(__dirname, './src/test/mocks/tool-page.tsx'),
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
