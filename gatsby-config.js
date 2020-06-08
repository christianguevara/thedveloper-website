require('dotenv').config({
  path: '.env',
});

const prismicHtmlSerializer = require('./src/utils/htmlSerializer');
const prismicLinkResolver = require('./src/utils/linkResolver');

const website = require('./config/website');
const { defaultLang } = require('./config/i18n');

const pathPrefix = website.pathPrefix === '/' ? '' : website.pathPrefix;

module.exports = {
  pathPrefix: website.pathPrefix,
  // siteMetadata: {
  //   title: 'Prist | Gatsby & Prismic Starter',
  //   description: 'A starter powered by Gatsby and Prismic to showcase portfolios and blogs.',
  //   author: 'Marguerite Roth | marguerite.io',
  // },
  siteMetadata: {
    siteUrl: website.url + pathPrefix, // For gatsby-plugin-sitemap
    pathPrefix,
    banner: website.logo,
    ogLanguage: website.ogLanguage,
    author: website.author,
    twitter: website.twitter,
    facebook: website.facebook,
    title: website.title,
    description: website.description,
  },
  plugins: [
    'gatsby-plugin-react-helmet',
    'gatsby-transformer-sharp',
    'gatsby-plugin-sharp',
    'gatsby-image',
    'gatsby-plugin-catch-links',
    'gatsby-plugin-sass',
    // 'gatsby-plugin-resolve-src',
    // 'gatsby-plugin-remove-trailing-slashes',
    'gatsby-plugin-emotion',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'images',
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: 'gatsby-source-prismic-graphql',
      options: {
        repositoryName: `${process.env.PRISMIC_REPOSITORY_NAME}`, // (REQUIRED, replace with your own)
        defaultLang,
        langs: ['en-us', 'es-ec'],
        accessToken: `${process.env.PRISMIC_ACCESS_TOKEN}`,
        // Get the correct URLs in blog posts
        linkResolver: () => prismicLinkResolver,
        // PrismJS highlighting for labels and slices
        htmlSerializer: () => prismicHtmlSerializer,
        path: '/preview',
        previews: true,
        shortenUrlLangs: true,
        pages: [
          {
            type: 'Homepage',
            match: '/:lang?/',
            previewPath: '/',
            component: require.resolve('./src/pages/index.js'),
            // sortBy: 'date_ASC',
            langs: ['en-us', 'es-ec'],
          },
          {
            type: 'Project',
            match: '/:lang?/work/',
            path: '/work',
            component: require.resolve('./src/pages/work.js'),
            // sortBy: 'date_ASC',
            langs: ['en-us', 'es-ec'],

          },
          {
            type: 'Project',
            match: '/:lang?/project/:uid',
            path: '/project',
            component: require.resolve('./src/templates/project.jsx'),
            // sortBy: 'date_ASC',
            langs: ['en-us', 'es-ec'],
          },
          {
            type: 'Post',
            match: '/:lang?/blog/',
            path: '/blog',
            component: require.resolve('./src/pages/blog.js'),
            // sortBy: 'date_ASC',
            langs: ['en-us', 'es-ec'],
          },
          {
            type: 'Post',
            match: '/:lang?/blog/:uid',
            path: '/post',
            component: require.resolve('./src/templates/post.jsx'),
            // sortBy: 'date_ASC',
            langs: ['en-us', 'es-ec'],
          },
        ],
        // linkResolver: () => (post) => `/${post.uid}`,
      },
    },
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: website.title,
        short_name: website.titleAlt,
        description: website.description,
        start_url: pathPrefix,
        background_color: website.backgroundColor,
        theme_color: website.themeColor,
        display: 'standalone',
        icon: website.favicon, // This path is relative to the root of the site.
      },
    },
    // https://www.gatsbyjs.org/packages/gatsby-plugin-google-analytics/
    {
      resolve: 'gatsby-plugin-google-analytics',
      options: {
        trackingId: website.googleAnalyticsID,
        head: true,
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
};
