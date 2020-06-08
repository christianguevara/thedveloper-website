import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { RichText } from 'prismic-reactjs';
import { graphql } from 'gatsby';
import styled from '@emotion/styled';
import colors from '../styles/colors';
import dimensions from '../styles/dimensions';
import Button from '../components/_ui/Button';
import About from '../components/About';
import { Layout, LocaleContext } from '../components/Layout';
import ProjectCard from '../components/ProjectCard';
import LocalizedLink from '../components/LocalizedLink';

const Hero = styled('div')`
    padding-top: 2.5em;
    padding-bottom: 3em;
    margin-bottom: 4em;
    max-width: 830px;

    @media(max-width:${dimensions.maxwidthMobile}px) {
       margin-bottom: 3em;
    }

    h1 {
        margin-bottom: 1em;
    }
`;

const RichTextWrapper = styled('div')`
    a {
            text-decoration: none;
            transition: all 100ms ease-in-out;

            &:nth-of-type(1) { color: ${colors.blue500}; }
            &:nth-of-type(2) { color: ${colors.orange500}; }
            &:nth-of-type(3) { color: ${colors.purple500}; }
            &:nth-of-type(4) { color: ${colors.green500}; }
            &:nth-of-type(5) { color: ${colors.teal500}; }

            &:hover {
                cursor: pointer;
                transition: all 100ms ease-in-out;

                &:nth-of-type(1) { color: ${colors.blue600};    background-color: ${colors.blue200};}
                &:nth-of-type(2) { color: ${colors.orange600};  background-color: ${colors.orange200};}
                &:nth-of-type(3) { color: ${colors.purple600};  background-color: ${colors.purple200};}
                &:nth-of-type(4) { color: ${colors.green600};   background-color: ${colors.green200};}
                &:nth-of-type(5) { color: ${colors.teal600};    background-color: ${colors.teal200};}

            }
        }
`;

const Section = styled('div')`
    margin-bottom: 10em;
    display: flex;
    flex-direction: column;

    @media(max-width:${dimensions.maxwidthTablet}px) {
        margin-bottom: 4em;
    }

    &:last-of-type {
        margin-bottom: 0;
    }
`;

const WorkAction = styled(LocalizedLink)`
    font-weight: 600;
    text-decoration: none;
    color: currentColor;
    transition: all 150ms ease-in-out;
    margin-left: auto;

    @media(max-width:${dimensions.maxwidthTablet}px) {
       margin: 0 auto;
    }

    span {
        margin-left: 1em;
        transform: translateX(-8px);
        display: inline-block;
        transition: transform 400ms ease-in-out;
    }

    &:hover {
        color: ${colors.blue500};
        transition: all 150ms ease-in-out;

        span {
            transform: translateX(0px);
            opacity: 1;
            transition: transform 150ms ease-in-out;
        }
    }
`;

const RenderBody = ({ home, projects, meta }) => {
  const locale = React.useContext(LocaleContext);
  const i18n = locale.i18n[locale.lang];

  return (
    <>
      <Helmet
        title={meta.title}
        titleTemplate={`%s | ${meta.title}`}
        meta={[
          {
            name: 'description',
            content: meta.description,
          },
          {
            property: 'og:title',
            content: meta.title,
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
      <Hero>
        <RichTextWrapper>
          {RichText.render(home.hero_title)}
        </RichTextWrapper>
        <a
          href={home.hero_button_link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button>
            {RichText.render(home.hero_button_text)}
          </Button>
        </a>
      </Hero>
      <Section>
        {/* <span>{`LANG: ${JSON.stringify(locale)}`}</span> */}
        {/* <span>{`i18n: ${JSON.stringify(i18n)}`}</span> */}
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
        <WorkAction to="/work">
          {i18n.moreWork}
          {' '}
          <span>&#8594;</span>
        </WorkAction>
      </Section>
      <Section id="about">
        {RichText.render(home.about_title)}
        <About
          bio={home.about_bio}
          socialLinks={home.about_links}
        />
      </Section>
    </>
  );
};

const indexWrapper = ({ data, pageContext }) => {
  // Required check for no data being returned
  const doc = data.prismic.allHomepages.edges.slice(0, 1).pop();
  const projects = data.prismic.allProjects.edges;
  const meta = data.site.siteMetadata;

  if (!doc || !projects) return null;

  return (
    <Layout pageContext={pageContext}>
      <RenderBody home={doc.node} projects={projects} meta={meta} />
    </Layout>
  );
};

indexWrapper.propTypes = {
  data: PropTypes.object.isRequired,
  pageContext: PropTypes.shape({
    lang: PropTypes.string.isRequired,
  }).isRequired,
};

export default indexWrapper;

RenderBody.propTypes = {
  home: PropTypes.object.isRequired,
  projects: PropTypes.array.isRequired,
  meta: PropTypes.object.isRequired,
};

export const query = graphql`
    query HomepageQuery($lang: String! = "en-us") {
        prismic {
            allHomepages(lang: $lang) {
                edges {
                    node {
                        _meta {
                            lang
                        } 
                        hero_title
                        hero_button_text
                        hero_button_link {
                            ... on PRISMIC__ExternalLink {
                                _linkType
                                url
                            }
                        }
                        content
                        about_title
                        about_bio
                        about_links {
                            about_link
                        }
                    }
                }
            }
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
