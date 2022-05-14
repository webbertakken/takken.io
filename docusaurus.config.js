// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

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
  organizationName: 'webbertakken', // Usually your GitHub org/user name.
  projectName: 'takken.io', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    'docusaurus-plugin-sass',
  ],
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        gtag: {
          trackingID: 'G-226F0LR9KE',
          anonymizeIP: true,
        },
        docs: {
          path: 'notes',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/webbertakken/takken.io/tree/main/',
        },
        blog: {
          routeBasePath: '/',
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/webbertakken/takken.io/tree/main/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
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
        },
        items: [

          {to: '/', label: 'Blog', position: 'left'},
          // {
          //   type: 'doc',
          //   docId: 'intro',
          //   position: 'left',
          //   label: 'Developer notes',
          // },
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
                label: 'Blog',
                to: '/',
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
            ],
          },
          {
            title: 'Projects',
            items: [
              {
                label: 'GameCI',
                href: 'https://github.com/game-ci',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Webber.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      algolia: {
        // The application ID provided by Algolia
        appId: 'D7O7VEQQIV',

        // Public API key: it is safe to commit it
        apiKey: '98d3cabea3c965994573b8f7f6e8254f',

        indexName: 'main',

        // Optional: see doc section below
        contextualSearch: true,

        // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
        externalUrlRegex: 'github\\.com|game\\.ci',

        // Optional: Algolia search parameters
        searchParameters: {},

        // Optional: path for search page that enabled by default (`false` to disable it)
        searchPagePath: 'search',

        //... other Algolia params
      },
    }),
};

module.exports = config;
