import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import Moment from 'react-moment';
import { graphql } from 'gatsby';
import { RichText } from 'prismic-reactjs';
import styled from '@emotion/styled';
import colors from '../styles/colors';
import { Layout, LocaleContext } from '../components/Layout';

const PostHeroContainer = styled('div')`
    max-height: 500px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    margin-bottom: 3em;

    img {
        width: 100%;
    }
`;

const PostHeroAnnotation = styled('div')`
    padding-top: 0.25em;

    h6 {
        text-align: right;
        color: ${colors.grey600};
        font-weight: 400;
        font-size: 0.85rem;
    }

    a {
        color: currentColor;
    }
`;

const PostCategory = styled('div')`
    max-width: 700px;
    margin: 0 auto;
    text-align: center;
    font-weight: 600;
    color: ${colors.grey600};

    h5 {
        margin-top: 0;
        margin-bottom: 1em;
    }
`;

const PostTitle = styled('div')`
    max-width: 700px;
    margin: 0 auto;
    text-align: center;

    h1 {
        margin-top: 0;
    }
`;

const PostBody = styled('div')`
  max-width: 700px;
  margin: 0 auto;

  .block-img {
    margin-top: 3.5em;
    margin-bottom: 0.5em;

    img {
        max-width: 100%;
    }
  }
  
  pre {
    font-family: Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace;
    white-space: pre-wrap;
    background: #1C262B;
    color: white;
    padding: 0.2em 0.2em 0.2em 1em;
    border-radius: 0.2em;
  }
`;

const PostMetas = styled('div')`
    max-width: 700px;
    display: flex;
    align-items: center;
    margin: 0 auto 2em;
    justify-content: space-between;
    font-size: 0.85em;
    color: ${colors.grey600};
`;

const PostAuthor = styled('div')`
    margin: 0;
`;

const PostDate = styled('div')`
    margin: 0;
`;

const Post = ({ post, meta }) => {
  const locale = React.useContext(LocaleContext);
  const i18n = locale.i18n[locale.lang];

  return (
    <>
      <Helmet
        title={`${post.post_title[0].text}`}
        titleTemplate={`%s | ${meta.title}`}
        meta={[
          {
            name: 'description',
            content: meta.description,
          },
          {
            property: 'og:title',
            content: `${post.post_title[0].text} | ${meta.title}`,
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
      <PostCategory>
        <RichText
          render={post.post_category}
        />
      </PostCategory>
      <PostTitle>
        <RichText
          render={post.post_title}
        />
      </PostTitle>
      <PostMetas>
        <PostAuthor>
          {post.post_author}
        </PostAuthor>
        <PostDate>
          <Moment format="LL" locale={i18n.locale} date={post.post_date} />
        </PostDate>
      </PostMetas>
      {post.post_hero_image && (
        <PostHeroContainer>
          <img src={post.post_hero_image.url} alt={post.post_hero_image.alt} />
          <PostHeroAnnotation>
            <RichText
              render={post.post_hero_annotation}
            />
          </PostHeroAnnotation>
        </PostHeroContainer>
      )}
      <PostBody>
        <RichText
          render={post.post_body}
        />
      </PostBody>
    </>
  );
};


const postWrapper = ({ data, pageContext }) => {
  const prismicContent = data.prismic.allPosts.edges[0];
  if (!prismicContent) return null;

  const postContent = prismicContent.node;
  const meta = data.site.siteMetadata;
  return (
    <Layout pageContext={pageContext}>
      <Post post={postContent} meta={meta} />
    </Layout>
  );
};

postWrapper.propTypes = {
  data: PropTypes.object.isRequired,
  pageContext: PropTypes.shape({
    lang: PropTypes.string.isRequired,
  }).isRequired,
};

export default postWrapper;

Post.propTypes = {
  post: PropTypes.shape({
    post_title: PropTypes.string.isRequired,
    post_date: PropTypes.object.isRequired,
    post_category: PropTypes.string.isRequired,
    post_body: PropTypes.string.isRequired,
    post_author: PropTypes.string.isRequired,
    post_hero_image: PropTypes.object.isRequired,
    post_hero_annotation: PropTypes.string.isRequired,
  }).isRequired,
  meta: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    author: PropTypes.string,
  }).isRequired,
};

export const query = graphql`
    query PostQuery($uid: String) {
        prismic {
            allPosts(uid: $uid) {
                edges {
                    node {
                        post_title
                        post_hero_image
                        post_hero_annotation
                        post_date
                        post_category
                        post_body
                        post_author
                        post_preview_description
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
