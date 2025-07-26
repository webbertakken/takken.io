import { defineConfig } from 'vitest/config'

export default defineConfig({
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
