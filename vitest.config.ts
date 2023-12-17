import('vitest/config')

export default {
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['html', 'lcov', 'clover'],
    },
  },
}
