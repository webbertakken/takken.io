module.exports = {
  env: {
    node: true,
    es2021: true,
    browser: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vitest/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'vitest'],
  overrides: [],
  parserOptions: { ecmaVersion: 12, sourceType: 'module' },
  rules: {
    'no-console': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-require-imports': ['error', { allow: ['.(jpg|png|svg|webp|gif)$'] }],
  },
  ignorePatterns: ['dist/', 'coverage/', 'build/', 'node_modules/', '.yarn/'],
}
