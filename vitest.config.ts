import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@site': path.resolve(__dirname),
      '@docusaurus/useGlobalData': path.resolve(__dirname, './src/test/mocks/docusaurus.ts'),
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
