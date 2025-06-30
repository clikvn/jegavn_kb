// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'JEGA Knowledge Base',
  tagline: 'Complete guide for Jega and AiHouse software',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://jegavn-kb.vercel.app',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'jega', // Usually your GitHub org/user name.
  projectName: 'knowledge-base', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'vi',
    locales: ['vi'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Please change this to your repo.
          editUrl:
            'https://github.com/jega/knowledge-base/tree/main/',
          routeBasePath: '/docs',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/jega/knowledge-base/tree/main/',
          blogSidebarTitle: 'Recent Posts',
          blogSidebarCount: 5,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // JEGA Knowledge Base social card
      image: 'img/jega_logo.png',
      
      // Meta tags for better social sharing
      metadata: [
        {name: 'keywords', content: 'jega, aihouse, furniture, design, software, knowledge, base'},
        {name: 'description', content: 'Complete guide for Jega and AiHouse software'},
        {property: 'og:type', content: 'website'},
        {property: 'og:title', content: 'JEGA Knowledge Base'},
        {property: 'og:description', content: 'Complete guide for Jega and AiHouse software'},
        {property: 'og:image', content: 'img/jega_logo.png'},
        {property: 'twitter:card', content: 'summary_large_image'},
        {property: 'twitter:title', content: 'JEGA Knowledge Base'},
        {property: 'twitter:description', content: 'Complete guide for Jega and AiHouse software'},
        {property: 'twitter:image', content: 'img/jega_logo.png'},
      ],
      
      // Mintlify-inspired navbar
      navbar: {
        logo: {
          alt: 'JEGA Official Logo',
          src: 'img/jega_logo.png',
          srcDark: 'img/jega_logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Documentation',
          }
        ],
        style: 'dark',
        hideOnScroll: false,
      },

      // Mintlify-inspired footer
      footer: {
        style: 'light',
        links: [],
        copyright: 'Powered by Clik JSC',
      },

      // Mintlify-inspired prism theme
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json', 'yaml', 'toml'],
        defaultLanguage: 'bash',
      },

      // Mintlify-inspired color mode
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },

      // Mintlify-inspired docs
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
    }),

  // Mintlify-inspired stylesheets
  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
      type: 'text/css',
    },
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  ],
};

export default config;
