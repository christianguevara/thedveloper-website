import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { Global } from '@emotion/core';
import globalStyles from '../styles/global';
import typeStyles from '../styles/typography';
import dimensions from '../styles/dimensions';
import Footer from './Footer';
import Header from './Header';
import '../styles/fonts.scss';
import i18n from '../../config/i18n';

const LayoutContainer = styled.div`
    max-width: ${dimensions.maxwidthDesktop}px;
    padding-left: ${dimensions.paddingHorizontalDesktop}em;
    padding-right: ${dimensions.paddingHorizontalDesktop}em;
    margin: 0 auto;

    @media(max-width: ${dimensions.maxwidthTablet}px) {
        padding-left: ${dimensions.paddingHorizontalTablet}em;
        padding-right: ${dimensions.paddingHorizontalTablet}em;
    }

    @media(max-width: ${dimensions.maxwidthMobile}px) {
        padding-left: ${dimensions.paddingHorizontalMobile}em;
        padding-right: ${dimensions.paddingHorizontalMobile}em;
    }

    .Layout__content {
        padding-bottom: 5em;
    }
`;

const LocaleContext = React.createContext();

const Layout = ({ children, pageContext }) => (
  // <StaticQuery
  //   query={graphql`
  //           query SiteTitleQuery {
  //               site {
  //                   siteMetadata {
  //                       title
  //                   }
  //               }
  //           }
  //       `}
  //   render={(data) => (
  <LocaleContext.Provider value={{ lang: pageContext.lang || i18n.defaultLang, i18n }}>
    <LayoutContainer className="div">
      <Global styles={[globalStyles, typeStyles]} />
      <div className="Layout">
        <Header />
        <main className="Layout__content">
          {children}
        </main>
        <Footer />
      </div>
    </LayoutContainer>
  </LocaleContext.Provider>
  // )}
  // />
);

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  pageContext: PropTypes.shape({
    lang: PropTypes.string.isRequired,
  }).isRequired,
};

export { LocaleContext, Layout };
