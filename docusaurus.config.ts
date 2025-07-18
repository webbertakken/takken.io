import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'
import tailwindPlugin from './plugins/tailwind-config.cjs' // add this

// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

// Errors that are actually in plugins may be hidden if stacktrace only shows 10 lines.
Error.stackTraceLimit = 20

require('dotenv').config()

const { github: theme, dracula: darkTheme } = require('prism-react-renderer').themes

const config: Config = {
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

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  plugins: [
    tailwindPlugin,
    ['docusaurus-plugin-sass', {}],
    [
      'docusaurus-plugin-content-gists',
      {
        enabled: true,
        verbose: true,
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
        quality: 90, // JPEG quality
        max: 2560, // max resized image's size.
        min: 738, // min resized image's size. if original is lower, use that size.
        steps: 4, // the max number of images generated between min and max (inclusive)
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
    // Main blog plugin
    [
      '@docusaurus/plugin-content-blog',
      {
        id: 'blog',
        routeBasePath: '/blog/',
        path: 'blog',
        showReadingTime: true,
        editUrl: 'https://github.com/webbertakken/takken.io/tree/main/',
      },
    ],
    // Mindset blog plugin
    [
      '@docusaurus/plugin-content-blog',
      {
        id: 'mindset',
        routeBasePath: '/mindset/',
        path: 'mindset',
        showReadingTime: false,
        editUrl: 'https://github.com/webbertakken/takken.io/tree/main/',
        // Customisations
        blogTitle: 'Mindset',
        blogDescription: 'Concepts for mental growth and development',
        postsPerPage: 'ALL', // Show all posts on one page
        blogSidebarCount: 0,
        sortPosts: 'ascending', // Show oldest concepts first
        feedOptions: {
          type: 'all',
          title: 'Takken.io - Mindset',
          description: 'Mindset concepts feed',
          limit: false, // Include all posts in feed
        },
        // Custom theme components for mindset
        blogListComponent: '@site/src/theme/mindset/BlogListPage',
        blogPostComponent: '@site/src/theme/mindset/BlogPostPage',
      },
    ],
  ],

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          path: 'notes',
          routeBasePath: '/notes/',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/webbertakken/takken.io/tree/main/',
        },
        blog: false, // Disabled because we're using separate blog plugins
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        sitemap: {
          lastmod: 'date',
          changefreq: null,
          priority: null,
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    metadata: [
      {
        name: 'darkreader-lock',
        content: 'this site supported dark mode and uses QR codes with white backgrounds',
      },
    ],
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
        { to: '/mindset', label: 'Mindset', position: 'left' },
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
            {
              label: 'Mindset',
              to: '/mindset',
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
    mermaid: {
      theme: { light: 'base', dark: 'base' },
      options: {
        // Using ChatGPT 4 mapping Dracula theme onto Mermaid theme
        themeVariables: {
          background: '#282a36',
          fontFamily: '"Fira Code", "Monaco", monospace',
          fontSize: '16px',
          primaryColor: '#6272a4',
          primaryTextColor: '#f8f8f2',
          secondaryColor: '#44475a',
          primaryBorderColor: '#6272a4',
          secondaryBorderColor: '#50fa7b',
          secondaryTextColor: '#f1fa8c',
          tertiaryColor: '#ff79c6',
          tertiaryBorderColor: '#ff79c6',
          tertiaryTextColor: '#ff79c6',
          noteBkgColor: '#44475a',
          noteTextColor: '#f8f8f2',
          noteBorderColor: '#44475a',
          lineColor: '#ff79c6',
          textColor: '#f8f8f2',
          mainBkg: '#6272a4',
          errorBkgColor: '#ff5555',
          errorTextColor: '#f8f8f2',
          // Flowchart Variables
          nodeBorder: '#ff79c6',
          clusterBkg: 'transparent',
          clusterBorder: '#999',
          defaultLinkColor: '#ff79c6',
          titleColor: '#888',
          edgeLabelBackground: '#ffb86c',
          nodeTextColor: '#f8f8f2',
          // Sequence Diagram Variables
          actorBkg: '#6272a4',
          actorBorder: '#ff79c6',
          actorTextColor: '#f8f8f2',
          actorLineColor: '#6272a4',
          signalColor: '#8be9fd',
          signalTextColor: '#f8f8f2',
          labelBoxBkgColor: '#44475a',
          labelBoxBorderColor: '#ff79c6',
          labelTextColor: '#f8f8f2',
          loopTextColor: '#f8f8f2',
          activationBorderColor: '#ffb86c',
          activationBkgColor: '#44475a',
          sequenceNumberColor: '#ff79c6',
          // Pie Diagram Variables
          pie1: '#ff5555',
          pie2: '#ff79c6',
          pie3: '#bd93f9',
          pie4: '#6272a4',
          pie5: '#8be9fd',
          pie6: '#50fa7b',
          pie7: '#f1fa8c',
          pie8: '#ffb86c',
          pie9: '#ff6e6e',
          pie10: '#ad51b6',
          pie11: '#a1a1a1',
          pie12: '#62d6e8',
          pieTitleTextSize: '25px',
          pieTitleTextColor: '#f8f8f2',
          pieSectionTextSize: '17px',
          pieSectionTextColor: '#f8f8f2',
          pieLegendTextSize: '17px',
          pieLegendTextColor: '#f8f8f2',
          pieStrokeColor: '#f8f8f2',
          pieStrokeWidth: '2px',
          pieOuterStrokeWidth: '2px',
          pieOuterStrokeColor: '#f8f8f2',
          pieOpacity: '0.7',
          // State Colors
          labelColor: '#f8f8f2',
          altBackground: '#44475a',
          // Class Colors
          classText: '#f8f8f2',
          // User Journey Colors
          fillType0: '#ff5555',
          fillType1: '#ff79c6',
          fillType2: '#bd93f9',
          fillType3: '#6272a4',
          fillType4: '#8be9fd',
          fillType5: '#50fa7b',
          fillType6: '#f1fa8c',
          fillType7: '#ffb86c',
        },
      },
    },
    prism: {
      theme,
      darkTheme,
      additionalLanguages: [
        'bash',
        'css',
        'diff',
        'git',
        'go',
        'ini',
        'javascript',
        'json',
        'jsx',
        'powershell',
        'rust',
        'tsx',
        'typescript',
      ],
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
  } satisfies Preset.ThemeConfig,
}

module.exports = config
