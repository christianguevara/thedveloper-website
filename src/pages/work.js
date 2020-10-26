import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';
import styled from '@emotion/styled';
import { Layout, LocaleContext } from '../components/Layout';
import ProjectCard from '../components/ProjectCard';

const WorkTitle = styled('h1')`
    margin-bottom: 1em;
`;

const Work = ({ projects, meta }) => {
  const locale = React.useContext(LocaleContext);
  const i18n = locale.i18n[locale.lang];

  return (
    <>
      <Helmet
        title="Work"
        titleTemplate="%s | The Dveloper"
        meta={[
          {
            name: 'description',
            content: meta.description,
          },
          {
            property: 'og:title',
            content: 'Work | Prist, Gatsby & Prismic Starter',
          },
          {
            property: 'og:description',
            content: meta.description,
          },
          {
            property: 'og:type',
            content: 'website',
          },
          {
            name: 'twitter:card',
            content: 'summary',
          },
          {
            name: 'twitter:creator',
            content: meta.author,
          },
          {
            name: 'twitter:title',
            content: meta.title,
          },
          {
            name: 'twitter:description',
            content: meta.description,
          },
        ].concat(meta)}
      />
      <WorkTitle>
        {i18n.workTitle}
      </WorkTitle>
      <>
        {projects.map((project) => (
          <ProjectCard
            key={project.node._meta.uid}
            category={project.node.project_category}
            title={project.node.project_title}
            description={project.node.project_preview_description}
            thumbnail={project.node.project_preview_thumbnail}
            uid={project.node._meta.uid}
          />
        ))}
      </>
    </>
  );
};

const workWrapper = ({ data, pageContext }) => {
  const projects = data.prismic.allProjects.edges;
  const meta = data.site.siteMetadata;
  if (!projects) return null;

  return (
    <Layout pageContext={pageContext}>
      <Work projects={projects} meta={meta} />
    </Layout>
  );
};

workWrapper.propTypes = {
  data: PropTypes.object.isRequired,
  pageContext: PropTypes.shape({
    lang: PropTypes.string.isRequired,
  }).isRequired,
};

export default workWrapper;

Work.propTypes = {
  projects: PropTypes.array.isRequired,
  meta: PropTypes.object.isRequired,
};

export const query = graphql`
    query WorkQuery($lang: String! = "en-us") {
        prismic {
            allProjects(lang: $lang) {
                edges {
                    node {
                        project_title
                        project_preview_description
                        project_preview_thumbnail
                        project_category
                        project_post_date
                        _meta {
                            uid
                            lang
                        }
                    }
                }
            }
        }
        site {
            siteMetadata {
                title
                description
                author
            }
        }
    }
`;
