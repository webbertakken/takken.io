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
