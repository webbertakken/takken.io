// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

require('dotenv').config()

const lightCodeTheme = require('prism-react-renderer/themes/github')
const darkCodeTheme = require('prism-react-renderer/themes/dracula')

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Takken.io',
  tagline: `Webber's personal website`,
  url: 'https://takken.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'images/icons/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'webbertakken', // Usually your GitHub org/username.
  projectName: 'takken.io', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    ['docusaurus-plugin-sass', {}],
    [
      'docusaurus-plugin-content-gists',
      {
        enabled: true,
        verbose: true,
        personalAccessToken: process.env.GH_PERSONAL_ACCESS_TOKEN,
      },
    ],
    [
      'docusaurus-plugin-content-tools',
      {
        enabled: true,
        verbose: true,
        toolsFolder: '@site/src/components/pages/Tools',
      },
    ],
    [
      'docusaurus-gtm-plugin',
      {
        id: 'GTM-T4M9CW8',
        enabled: true,
      },
    ],
    [
      '@docusaurus/plugin-ideal-image',
      {
        quality: 70,
        max: 1030, // max resized image's size.
        min: 640, // min resized image's size. if original is lower, use that size.
        steps: 3, // the max number of images generated between min and max (inclusive)
        disableInDev: false,
      },
    ],
    [
      '@docusaurus/plugin-pwa',
      {
        debug: true,
        offlineModeActivationStrategies: ['appInstalled', 'standalone', 'queryString'],
        pwaHead: [
          {
            tagName: 'link',
            rel: 'icon',
            href: '/images/icons/icon-192x192.png',
          },
          {
            tagName: 'link',
            rel: 'manifest',
            href: '/manifest.json',
          },
          {
            tagName: 'meta',
            name: 'theme-color',
            content: 'rgb(255, 54, 136)',
          },
        ],
      },
    ],
  ],
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: 'notes',
          routeBasePath: '/notes/',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/webbertakken/takken.io/tree/main/',
        },
        blog: {
          routeBasePath: '/blog/',
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/webbertakken/takken.io/tree/main/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Takken.io',
        logo: {
          alt: 'Takken.io',
          src: 'images/logo.svg',
          width: 32,
          height: 32,
        },
        items: [
          {
            type: 'doc',
            docId: 'index',
            position: 'left',
            label: 'Notes',
          },
          { to: '/tools', label: 'Tools', position: 'left' },
          { to: '/gists', label: 'Gists', position: 'left' },
          { to: '/blog', label: 'Blog', position: 'left' },
          {
            href: 'https://github.com/webbertakken/takken.io',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          // {
          //   title: 'Developer notes',
          //   items: [
          //     {
          //       label: 'Tutorial',
          //       to: '/notes/intro',
          //     },
          //   ],
          // },
          {
            title: 'About me',
            items: [
              {
                to: '/notes/introduction',
                label: 'Notes',
              },
              {
                to: '/tools',
                label: 'Tools',
              },
              {
                to: '/gists',
                label: 'Code snippets',
              },
              {
                label: 'Blog',
                to: '/blog',
              },
            ],
          },
          {
            title: 'Social',
            items: [
              {
                label: 'Twitter',
                href: 'https://twitter.com/webbertakken',
              },
              {
                label: 'LinkedIn',
                href: 'https://www.linkedin.com/in/webbertakken/',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/webbertakken',
              },
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/users/3593896/webber',
              },
            ],
          },
          {
            title: 'Projects',
            items: [
              {
                label: 'GameCI',
                href: 'https://github.com/game-ci',
              },
              {
                label: 'PR Code Reviewer',
                href: 'https://github.com/marketplace/pr-code-reviewer',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Webber.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['powershell', 'rust', 'ini'],
      },
      algolia: {
        // The application ID provided by Algolia
        appId: '4WBSGCFS9Z',

        // Public API key: it is safe to commit it
        apiKey: 'dc151c43e2380f4740f1bb41b8191e51',

        indexName: 'takken',

        // Optional: see doc section below
        contextualSearch: true,

        // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
        // externalUrlRegex: 'github\\.com|game\\.ci',

        // Optional: Algolia search parameters
        searchParameters: {},

        // Optional: path for search page that enabled by default (`false` to disable it)
        searchPagePath: 'search',

        //... other Algolia params
      },
    }),
}

module.exports = config
