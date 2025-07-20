import type { Config } from 'tailwindcss'

const singleFont = [
  '"Fira Mono"', // Imported in custom.css
  'SFMono-Regular', // ... fallbacks
  'Menlo',
  'Monaco',
  'Consolas',
  '"Liberation Mono"',
  '"Courier New"',
  'monospace',
]

export default {
  darkMode: ['class', '[data-theme="dark"]'], // Backwards compatibility with Docusaurus theme
  content: ['./src/**/*.{js,jsx,ts,tsx,md,mdx}', './notes/**/*.{js,jsx,ts,tsx,md,mdx}'],
  theme: {
    fontFamily: {
      sans: singleFont,
      mono: singleFont,
    },
    extend: {
      colors: {
        pink: '#e6006b',
        'pink-dark': '#cf0060',
        'pink-darker': '#c4005b',
        'pink-darkest': '#a1004b',
        'pink-light': '#fd0076',
        'pink-lighter': '#ff0a7c',
        'pink-lightest': '#ff2c8e',
      },
    },
  },
  plugins: [],
} satisfies Config
