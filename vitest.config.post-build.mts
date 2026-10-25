import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Only include post-build tests
    include: ['tests/post-build/**/*.{test,spec}.ts'],
    // Don't exclude anything for post-build tests
    exclude: ['**/node_modules/**'],
  },
})
