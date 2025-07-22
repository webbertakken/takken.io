function tailwindPlugin() {
  return {
    name: 'tailwind-plugin',
    configurePostCss(postcssOptions) {
      postcssOptions.plugins = ['postcss-import', '@tailwindcss/postcss', 'autoprefixer']
      return postcssOptions
    },
  }
}

module.exports = tailwindPlugin
