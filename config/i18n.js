const website = require('./website');

const config = {
  'en-us': {
    default: true,
    path: 'en',
    locale: 'en-us',
    siteLanguage: 'en',
    ogLang: 'en_US',
    defaultTitle: website.title,
    defaultTitleAlt: website.titleAlt,
    defaultDescription: website.description,
    headline: website.headline,
    category: 'Category',
    categories: 'Categories',
    was: 'was',
    were: 'were',
    tagged: 'tagged with',
    recent: 'Recent',
    projects: 'projects',
    allCategories: 'All categories',
    entries: 'entries',

    // Pages
    // Home
    emailMe: 'Email me',
    projectDetails: 'Details',
    moreWork: 'See more work',
    blogTitle: 'Blog | The Dveloper',
    blogTitleOg: 'Blog | The Dveloper',

    // Poject detail
    moreProjects: 'See other work',


  },
  'es-ec': {
    path: 'es',
    locale: 'es-ec',
    siteLanguage: 'es',
    ogLang: 'es_EC',
    defaultTitle: website.title,
    defaultTitleAlt: website.titleAlt,
    defaultDescription: 'Basierend auf gatsby-starter-prismic mit Unterstützung für Lokalisierung (i18n)',
    headline: 'Schreiben und Veröffentlichen für LekoArts',
    category: 'Kategorie',
    categories: 'Kategorien',
    was: 'wurde',
    were: 'wurden',
    tagged: 'markiert mit',
    recent: 'Neue',
    projects: 'Projekte',
    allCategories: 'Alle Kategorien',
    entries: 'Einträge',

    projectDetails: 'Detalles',
    moreWork: 'Ver más proyectos',
  },
};

config.defaultLang = Object.keys(config).filter((e) => config[e].default)[0];

module.exports = config;
