import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { graphql } from 'gatsby';
import styled from '@emotion/styled';
import dimensions from '../styles/dimensions';
import { Layout } from '../components/Layout';
import PostCard from '../components/PostCard';

const BlogTitle = styled('h1')`
    margin-bottom: 1em;
`;

const BlogGrid = styled('div')`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 2.5em;

    @media(max-width: 1050px) {
        grid-template-columns: repeat(2, 1fr);
        grid-gap: 1.5em;
    }

    @media(max-width: ${dimensions.maxwidthMobile}px) {
        grid-template-columns: 1fr;
        grid-gap: 2.5em;
    }
`;

const Blog = ({ posts, meta, pageContext }) => (
  <>
    <Helmet
      title="Blog | The Dveloper"
      titleTemplate="%s | Blog | The Dveloper"
      meta={[
        {
          name: 'description',
          content: meta.description,
        },
        {
          property: 'og:title',
          content: 'Blog | The Dveloper',
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
    <Layout pageContext={pageContext}>
      <BlogTitle>
        Blog
      </BlogTitle>
      <BlogGrid>
        {posts.map((post) => (
          <PostCard
            key={post.node._meta.uid}
            author={post.node.post_author}
            category={post.node.post_category}
            title={post.node.post_title}
            date={post.node.post_date}
            description={post.node.post_preview_description}
            uid={post.node._meta.uid}
          />
        ))}
      </BlogGrid>
    </Layout>
  </>
);

const blogWrapper = ({ data, pageContext }) => {
  const posts = data.prismic.allPosts.edges;
  const meta = data.site.siteMetadata;
  if (!posts) return null;

  return (
    <Blog posts={posts} meta={meta} pageContext={pageContext} />
  );
};

blogWrapper.propTypes = {
  data: PropTypes.object.isRequired,
  pageContext: PropTypes.shape({
    lang: PropTypes.string.isRequired,
  }).isRequired,
};

export default blogWrapper;

Blog.propTypes = {
  posts: PropTypes.array.isRequired,
  meta: PropTypes.object.isRequired,
  pageContext: PropTypes.shape({
    lang: PropTypes.string.isRequired,
  }).isRequired,
};


export const query = graphql`
    query BlogQuery($lang: String! = "es-ec") {
        prismic {
            allPosts(lang: $lang, sortBy: post_date_DESC) {
                edges {
                    node {
                        post_title
                        post_date
                        post_category
                        post_preview_description
                        post_author
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
