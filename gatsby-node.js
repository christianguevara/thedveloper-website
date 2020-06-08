// const _ = require('lodash');
// const locales = require('./config/i18n');
// const {
//   replaceTrailing, localizedSlug, replaceBoth, wrapper,
// } = require('./src/utils/gatsby-node-helpers');


// Take the pages from src/pages and generate pages for all locales, e.g. /index and /en/index
// exports.onCreatePage = ({ page, actions }) => {
//   const { createPage, deletePage } = actions;
//
//   // console.log(`--> PagePath ${page.path}`);
//
//
//   // TO avoid duplicates
//   if (page.context && page.context.locale) {
//     return;
//   }
//
//   console.log(`--> PagePath ${JSON.stringify(page)}`);
//
//   // Only create one 404 page at /404.html
//   if (page.path.includes('404')) {
//     return;
//   }
//
//   // First delete the pages so we can re-create them
//   deletePage(page);
//
//   Object.keys(locales).map((lang) => {
//     // Remove the trailing slash from the path, e.g. --> /categories
//     // eslint-disable-next-line no-param-reassign
//     // page.path = replaceTrailing(page.path);
//
//     // Remove the leading AND traling slash from path, e.g. --> categories
//     // const name = replaceBoth(page.path);
//
//     // Create the "slugs" for the pages. Unless default language, add prefix àla "/en"
//     // const localizedPath = locales[lang].default ? page.path : `${locales[lang].path}${page.path}`;
//
//     return createPage({
//       ...page,
//       // path: localizedPath,
//       context: {
//         locale: lang,
//         // name,
//       },
//     });
//   });
// };

// exports.createPages = async ({ graphql, actions }) => {
//   // const { createPage } = actions;
//   // const projectTemplate = require.resolve('./src/templates/project.jsx');
//   // const postTemplate = require.resolve('./src/templates/post.jsx');
//   //
//   // const result = await wrapper(
//   //   graphql(`
//   //       {
//   //           prismic {
//   //               allProjects {
//   //                   edges {
//   //                       node {
//   //                           project_title
//   //                           project_preview_description
//   //                           project_preview_thumbnail
//   //                           project_category
//   //                           project_post_date
//   //                           _meta {
//   //                               uid
//   //                               lang
//   //                           }
//   //                       }
//   //                   }
//   //               }
//   //               allPosts {
//   //                   edges {
//   //                       node {
//   //                           post_title
//   //                           post_hero_image
//   //                           post_hero_annotation
//   //                           post_date
//   //                           post_category
//   //                           post_body
//   //                           post_preview_description
//   //                           post_author
//   //                           _meta {
//   //                               uid
//   //                               lang
//   //                           }
//   //                       }
//   //                   }
//   //               }
//   //           }
//   //       }
//   //   `),
//   // );
//
//   // const projectsList = result.data.prismic.allProjects.edges;
//   // const postsList = result.data.prismic.allPosts.edges;
//
//   // projectsList.forEach((edge) => {
//   //   // The uid you assigned in Prismic is the slug!
//   //   createPage({
//   //     type: 'Project',
//   //     match: '/:lang?/work/:uid',
//   //     path: `/work/${edge.node._meta.lang}/${edge.node._meta.uid}`,
//   //     component: projectTemplate,
//   //     context: {
//   //       // Pass the unique ID (uid) through context so the template can filter by it
//   //       uid: edge.node._meta.uid,
//   //       lang: edge.node._meta.lang,
//   //     },
//   //   });
//   // });
//   //
//   // postsList.forEach((edge) => {
//   //   createPage({
//   //     type: 'Project',
//   //     match: '/:lang?/blog/:uid',
//   //     path: `/blog/${edge.node._meta.lang}/${edge.node._meta.uid}`,
//   //     component: postTemplate,
//   //     context: {
//   //       uid: edge.node._meta.uid,
//   //       lang: edge.node._meta.lang,
//   //     },
//   //   });
//   // });
//
//   // projectsList.forEach((edge) => {
//   //   // The uid you assigned in Prismic is the slug!
//   //   createPage({
//   //     type: 'Project',
//   //     match: '/:lang?/work/:uid',
//   //     // path: `/work/${edge.node._meta.lang}/${edge.node._meta.uid}`,
//   //     path: `/work${localizedSlug(edge.node)}`,
//   //     // path: '/work',
//   //     component: projectTemplate,
//   //     context: {
//   //       // Pass the unique ID (uid) through context so the template can filter by it
//   //       uid: edge.node._meta.uid,
//   //       locale: edge.node._meta.lang,
//   //     },
//   //   });
//   // });
//
//   // postsList.forEach((edge) => {
//   //   createPage({
//   //     type: 'Project',
//   //     match: '/:lang?/blog/:uid',
//   //     // path: `/blog/${edge.node._meta.lang}/${edge.node._meta.uid}`,
//   //     path: `/blog${localizedSlug(edge.node)}`,
//   //     // path: '/blog',
//   //     component: postTemplate,
//   //     context: {
//   //       uid: edge.node._meta.uid,
//   //       locale: edge.node._meta.lang,
//   //     },
//   //   });
//   // });
// };
