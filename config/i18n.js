const website = require('./website');

const config = {
  'en-us': {
    default: false,
    path: 'en',
    locale: 'en-us',
    siteLanguage: 'en',
    ogLang: 'en_US',
    defaultTitle: website.title,
    defaultTitleAlt: website.titleAlt,
    defaultDescription: website.description,
    headline: website.headline,

    // Pages
    // Home
    emailMe: 'Email me',
    projectDetails: 'Details',
    moreWork: 'See more work',
    blogTitle: 'Blog | The Dveloper',
    blogTitleOg: 'Blog | The Dveloper',

    // Project page
    workTitle: 'Work',

    // Project detail
    moreProjects: 'See other work',


  },
  'es-ec': {
    default: true,
    path: 'es',
    locale: 'es-ec',
    siteLanguage: 'es',
    ogLang: 'es_EC',
    defaultTitle: website.title,
    defaultTitleAlt: website.titleAlt,
    defaultDescription: 'Sitio web personal para mostrar el portfolio de trabajo + blog de Christian Guevara , bienvenidos :)',
    headline: 'Alguna cosa mientras SEO es implementado',

    // Pages
    // Home
    emailMe: 'Envíame un email',
    projectDetails: 'Detalles',
    moreWork: 'Ver más proyectos',
    blogTitle: 'Blog | The Dveloper',
    blogTitleOg: 'Blog | The Dveloper',

    // Project page
    workTitle: 'Mis proyectos',

    // Project detail
    moreProjects: 'Ver otros proyectos',
  },
};

config.defaultLang = Object.keys(config).filter((e) => config[e].default)[0];

module.exports = config;
