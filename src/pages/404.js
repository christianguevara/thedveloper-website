import React from 'react';
import PropTypes from 'prop-types';
import { Layout } from '../components/Layout';

const NotFoundPage = ({ pageContext }) => (
  <Layout pageContext={pageContext}>
    <h1>
      NOT FOUND
    </h1>
    <p>
      You just hit a route that doesn&#39;t exist... the sadness.
    </p>
  </Layout>
);


NotFoundPage.propTypes = {
  pageContext: PropTypes.shape({
    lang: PropTypes.string.isRequired,
  }).isRequired,
};

export default NotFoundPage;
