## Why

Tailwind CSS 4.2 shipped `@tailwindcss/webpack`, a dedicated webpack loader that replaces the
PostCSS-based integration (`@tailwindcss/postcss` + `postcss-import` + `autoprefixer`). It
eliminates PostCSS as a middleman — working directly with CSS strings via the Rust-based Oxide
scanner and Lightning CSS for optimisation — resulting in a simpler dependency graph and better
webpack integration (native dependency tracking, incremental rebuilds with LRU caching).

## What changes

- **Replace** `configurePostCss()` plugin with `configureWebpack()` plugin that walks webpack rules
  and swaps `postcss-loader` for `@tailwindcss/webpack`
- **Add** `@tailwindcss/webpack` as a dev dependency
- **Upgrade** `tailwindcss` from `^4.1.11` to `^4.2.0`
- **Remove** dev dependencies: `@tailwindcss/postcss`, `postcss-import`, `autoprefixer`, `postcss`,
  `@types/postcss-import`
- **No CSS changes** — `global.css` with `@import "tailwindcss/theme.css"` /
  `@import "tailwindcss/utilities.css"` and `@theme` directives work identically with the webpack
  loader

## Capabilities

### New capabilities

- `tailwind-webpack-integration`: Docusaurus plugin that uses `configureWebpack()` to replace
  `postcss-loader` with `@tailwindcss/webpack` in the CSS loader chain

### Modified capabilities

_(none — no existing specs)_

## Impact

- **Files changed**: `src/plugins/tailwind-config.cjs`, `package.json`
- **Dependencies removed** (5): `@tailwindcss/postcss`, `postcss-import`, `autoprefixer`, `postcss`,
  `@types/postcss-import`
- **Dependencies added** (1): `@tailwindcss/webpack`
- **Dependencies upgraded** (1): `tailwindcss` ^4.1.11 → ^4.2.0
- **Risk**: The `configureWebpack()` rule-walking approach is more fragile than `configurePostCss()`
  — Docusaurus internal webpack rule structure could change between versions. Non-Tailwind CSS files
  (`.module.css`) pass through without `postcss-preset-env`, losing vendor prefixing for those
  files. Given the modern browser targets (`>0.5%, not dead`) this is negligible.
- **SCSS unaffected**: `docusaurus-plugin-sass` adds its own loader rules; the tailwind loader
  passes through SCSS output (no Tailwind directives) as a no-op.
