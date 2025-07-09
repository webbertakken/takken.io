import('vitest/config')

export default {
  test: {
    // Exclude post-build tests from regular test runs
    exclude: ['**/node_modules/**', '**/tests/post-build/**'],
    coverage: {
      provider: 'v8',
      reporter: ['html', 'lcov', 'clover'],
    },
  },
}
