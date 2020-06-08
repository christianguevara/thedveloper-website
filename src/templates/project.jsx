import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import styled from '@emotion/styled';
import { graphql } from 'gatsby';
import { RichText } from 'prismic-reactjs';
import colors from '../styles/colors';
import Button from '../components/_ui/Button';
import { Layout, LocaleContext } from '../components/Layout';
import LocalizedLink from '../components/LocalizedLink';

const ProjectHeroContainer = styled('div')`
    background: ${colors.grey200};
    display: flex;
    justify-content: center;
    align-items: flex-end;
    overflow: hidden;
    position: relative;
    padding-top: 2.25em;
    margin-bottom: 3.5em;

    img {
        max-width: 600px;
    }
`;

const ProjectTitle = styled('div')`
    max-width: 550px;
    margin: 0 auto;
    text-align: center;
`;

const ProjectBody = styled('div')`
    max-width: 550px;
    margin: 0 auto;

    .block-img {
        margin-top: 3.5em;
        margin-bottom: 0.5em;

        img {
            width: 100%;
        }
    }
`;

const WorkLink = styled(LocalizedLink)`
    margin-top: 3em;
    display: block;
    text-align: center;
`;


const Project = ({ project, meta }) => {
  const locale = React.useContext(LocaleContext);
  const i18n = locale.i18n[locale.lang];

  return (
    <>
      <Helmet
        title={`${project.project_title[0].text} | Prist, Gatsby & Prismic Starter`}
        titleTemplate={`%s | ${meta.title}`}
        meta={[
          {
            name: 'description',
            content: meta.description,
          },
          {
            property: 'og:title',
            content: `${project.project_title[0].text} | Prist, Gatsby & Prismic Starter`,
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

      <ProjectTitle>
        {RichText.render(project.project_title)}
      </ProjectTitle>
      {project.project_hero_image && (
        <ProjectHeroContainer>
          <img src={project.project_hero_image.url} alt="bees" />
        </ProjectHeroContainer>
      )}
      <ProjectBody>
        {RichText.render(project.project_description)}
        <WorkLink to="/work">
          <Button className="Button--secondary">
            {i18n.moreProjects}
          </Button>
        </WorkLink>
      </ProjectBody>
    </>
  );
};

const projectWrapper = ({ data, pageContext }) => {
  const prismicContent = data.prismic.allProjects.edges[0];
  if (!prismicContent) return null;

  const projectContent = prismicContent.node;
  const meta = data.site.siteMetadata;
  return (
    <Layout pageContext={pageContext}>
      <Project project={projectContent} meta={meta} />
    </Layout>
  );
};

projectWrapper.propTypes = {
  data: PropTypes.object.isRequired,
  pageContext: PropTypes.shape({
    lang: PropTypes.string.isRequired,
  }).isRequired,
};

export default projectWrapper;

Project.propTypes = {
  project: PropTypes.object.isRequired,
  meta: PropTypes.object.isRequired,
};

export const query = graphql`
    query ProjectQuery($uid: String) {
        prismic {
            allProjects(uid: $uid) {
                edges {
                    node {
                        project_title
                        project_preview_description
                        project_preview_thumbnail
                        project_category
                        project_post_date
                        project_hero_image
                        project_description
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
