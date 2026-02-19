## Upgrade Tailwind CSS to 4.2 with `@tailwindcss/webpack` loader

Replaces the PostCSS-based Tailwind integration with the new dedicated webpack loader, eliminating
PostCSS as a middleman.

- **Add** `@tailwindcss/webpack` (uses Rust-based Oxide scanner + Lightning CSS)
- **Remove** `@tailwindcss/postcss`, `postcss-import`, `autoprefixer`, `postcss`,
  `@types/postcss-import`
- **Upgrade** `tailwindcss` ^4.1.11 → ^4.2.0
- **Fix** pre-existing CSS warnings surfaced by Lightning CSS

<details>
<summary><strong>Dependencies</strong></summary>

```
yarn add -D @tailwindcss/webpack@latest tailwindcss@latest
yarn remove @tailwindcss/postcss postcss-import autoprefixer postcss @types/postcss-import
```

Net: **-4 dev dependencies**

</details>

<details>
<summary><code>src/plugins/tailwind-config.cjs</code> — replace <code>configurePostCss()</code> with <code>configureWebpack()</code></summary>

```js
/**
 * Docusaurus plugin that replaces postcss-loader with @tailwindcss/webpack
 * in the CSS loader chain. The webpack loader handles Tailwind compilation
 * directly (via the Rust-based Oxide scanner) and uses Lightning CSS for
 * optimisation, eliminating the need for PostCSS, postcss-import, and autoprefixer.
 *
 * Non-Tailwind CSS files pass through unchanged (the loader bails out early
 * when no Tailwind directives are detected).
 */
function tailwindPlugin() {
  return {
    name: 'tailwind-plugin',
    configureWebpack(config) {
      replacePostcssLoader(config.module?.rules)
      return {}
    },
  }
}

/** Recursively walk webpack rules and replace postcss-loader with @tailwindcss/webpack. */
function replacePostcssLoader(rules) {
  if (!Array.isArray(rules)) return

  for (const rule of rules) {
    if (!rule) continue
    if (rule.oneOf) replacePostcssLoader(rule.oneOf)
    if (rule.rules) replacePostcssLoader(rule.rules)

    if (Array.isArray(rule.use)) {
      for (let i = 0; i < rule.use.length; i++) {
        const loader = rule.use[i]
        const loaderPath = typeof loader === 'string' ? loader : loader?.loader
        if (loaderPath && loaderPath.includes('postcss-loader')) {
          rule.use[i] = '@tailwindcss/webpack'
        }
      }
    }
  }
}

module.exports = tailwindPlugin
```

</details>

<details>
<summary><code>src/global.css</code> — fix <code>@import</code> ordering and invalid selector</summary>

**1. Move Google Fonts `@import` before Tailwind imports:**

```css
/* Before */
@import 'tailwindcss/theme.css';
@import 'tailwindcss/utilities.css';
@import url('https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;500;700&display=swap');

/* After */
@import url('https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;500;700&display=swap');
@import 'tailwindcss/theme.css';
@import 'tailwindcss/utilities.css';
```

**2. Fix invalid `:not()` selector:**

```css
/* Before (invalid — * wildcard not supported in class selectors) */
.main-wrapper:not(.docsWrapper*) {

/* After (attribute substring match) */
.main-wrapper:not([class*="docsWrapper"]) {
```

</details>

<details>
<summary><strong>How it works</strong></summary>

The `@tailwindcss/webpack` loader is a drop-in replacement for the `postcss-loader` +
`@tailwindcss/postcss` combination. Instead of going through PostCSS's AST pipeline, it:

1. Checks CSS for Tailwind directives — bails out early if none found
2. Compiles via `@tailwindcss/node` (handles `@import`, `@apply`, `@theme`, etc.)
3. Scans source files for utility classes via the Rust-based Oxide scanner
4. Builds final CSS with only the utilities actually used
5. Optimises/minifies via Lightning CSS (replaces autoprefixer)

Since Docusaurus doesn't have a native hook for swapping webpack loaders, the plugin uses
`configureWebpack()` to recursively walk the rule tree and replace `postcss-loader` entries.

</details>

### Verification

- Build: clean, zero warnings
- Vitest: 47/47 pass
- Post-build security: 3/3 pass
