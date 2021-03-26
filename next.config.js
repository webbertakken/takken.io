/* eslint-disable unicorn/no-array-reduce,no-param-reassign,@typescript-eslint/no-shadow */

const withBundleAnalyzer = require('@next/bundle-analyzer')
const withCSS = require('@zeit/next-css')
const withLess = require('@zeit/next-less')
const withSass = require('@zeit/next-sass')
const withPWA = require('next-pwa')
const withOptimizedImages = require('next-optimized-images')

const isProdBuild = process.env.NODE_ENV === 'production'

const baseNextConfig = {
  target: 'serverless',

  async redirects() {
    return [
      {
        source: '/',
        destination: '/blog',
        permanent: false,
      },
    ]
  },
}

const lessNextConfig = {
  lessLoaderOptions: {
    javascriptEnabled: true,
  },

  webpack: (config, options) => {
    if (options.isServer) {
      const antStylesPattern = /antd\/.*?\/style.*?/
      const originalExternals = [...config.externals]

      config.externals = [
        (context, request, callback) => {
          if (antStylesPattern.test(request) || typeof originalExternals[0] !== 'function') {
            callback()
          } else {
            originalExternals[0](context, request, callback)
          }
        },
        ...(typeof originalExternals[0] === 'function' ? [] : originalExternals),
      ]

      config.module.rules.unshift({
        test: antStylesPattern,
        use: 'null-loader',
      })
    }

    return config
  },
}

const sassNextConfig = {
  cssModules: true,
}

const optimizedImagesNextConfig = {
  /**
   * Auto-detects:
   * - imagemin-mozjpeg
   * - imagemin-optipng
   * - webp-loader
   */
}

const pwaNextConfig = {
  pwa: {
    dest: 'public',
    disable: !isProdBuild,
  },
}

const compose = (plugins) => ({
  ...baseNextConfig,

  webpack: (config, options) => {
    config.module.rules.push(
      {
        test: /\.md$/,
        use: 'raw-loader',
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
    )

    return plugins.reduce((config, plugin) => {
      if (Array.isArray(plugin)) {
        const [pluginFunction, ...pluginArguments] = plugin
        plugin = pluginFunction(...pluginArguments)
      }
      if (plugin instanceof Function) {
        plugin = plugin()
      }
      if (plugin && plugin.webpack instanceof Function) {
        return plugin.webpack(config, options)
      }
      return config
    }, config)
  },

  webpackDevMiddleware(config) {
    return plugins.reduce((config, plugin) => {
      if (Array.isArray(plugin)) {
        const [pluginFunction, ...pluginArguments] = plugin
        plugin = pluginFunction(...pluginArguments)
      }
      if (plugin instanceof Function) {
        plugin = plugin()
      }
      if (plugin && plugin.webpackDevMiddleware instanceof Function) {
        return plugin.webpackDevMiddleware(config)
      }
      return config
    }, config)
  },
})

module.exports = compose([
  isProdBuild ? [withPWA, pwaNextConfig] : null,
  [withBundleAnalyzer, { enabled: process.env.ANALYZE === 'true' }],
  [withCSS],
  [withLess, lessNextConfig],
  [withSass, sassNextConfig],
  [withOptimizedImages, optimizedImagesNextConfig],
])
