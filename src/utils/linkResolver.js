// -- The Link Resolver
// This function will be used to generate links to Prismic documents
// As your project grows, you should update this function according to your routes

const i18n = require('../../config/i18n');

// const linkResolver = (doc) => {
//   console.log(`linkResolver ${JSON.stringify(doc)}`);
//   const prefix = i18n[doc.lang].default ? '/' : `/${i18n[doc.lang].path}/`;
//
//   return `${prefix}${doc.uid}`;
// };
// module.exports = linkResolver;


const linkResolver = (doc) => {
  if (doc.type === 'project') {
    return `/project/${doc.uid}`;
  }

  if (doc.type === 'blog') {
    return `/blog/${doc.uid}`;
  }

  return '/';
};

module.exports = linkResolver;
