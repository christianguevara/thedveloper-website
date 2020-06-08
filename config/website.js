module.exports = {
  pathPrefix: '/', // Prefix for all links. If you deploy your site to example.com/portfolio your pathPrefix should be "portfolio"
  title: 'The Dveloper', // Navigation and Site Title
  titleAlt: 'The Dveloper', // Title for JSONLD
  description: 'Personal website to showcase a portfolio + blog for Christian Guevara, welcome :)',
  headline: 'Some data while SEO is implemented lol', // Headline for schema.org JSONLD
  url: 'https://theDveloper.com', // Domain of your site. No trailing slash!
  logo: 'src/images/logo-face-only.png', // Used for SEO
  ogLanguage: 'en_US', // Facebook Language

  // JSONLD / Manifest
  favicon: 'src/favicon.png', // Used for manifest favicon generation
  shortName: 'Prismic', // shortname for manifest. MUST be shorter than 12 characters
  author: 'Christian Guevara', // Author for schemaORGJSONLD
  themeColor: '#3D63AE',
  backgroundColor: '#EBEDF2',

  twitter: '@cgTheDev', // Twitter Username
  facebook: 'christian-guevara-ec', // Facebook Site Name
  googleAnalyticsID: 'UA-XXXXXX-X',

  skipNavId: 'reach-skip-nav', // ID for the "Skip to content" a11y feature
};
