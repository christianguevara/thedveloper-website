import React from 'react';
import { Link } from 'gatsby';
import styled from '@emotion/styled';
import colors from '../styles/colors';
import dimensions from '../styles/dimensions';
import Logo from './_ui/Logo';
import LocalizedLink from './LocalizedLink';
import { LocaleContext } from './Layout';

const HeaderContainer = styled('div')`
    padding-top: 3.75em;
    padding-bottom: 3em;
    
    svg, img {
        max-width: 160px;
    }
`;

const HeaderContent = styled('div')`
    display: flex;
    justify-content: space-between;
`;

const HeaderLinks = styled('div')`
    display: grid;
    grid-template-columns: repeat(4, auto);
    grid-gap: 4em;
    justify-content: flex-end;
    width: 100%;
    max-width: 200px;

    @media(max-width: ${dimensions.maxwidthTablet}px) {
        grid-gap: 5.5em;
    }

    @media(max-width: ${dimensions.maxwidthMobile}px) {
        grid-gap: 2.5em;
    }

    a {
        color: currentColor;
        text-decoration: none;
        border-bottom: 3px solid transparent;
        font-weight: 600;
        font-size: 0.95em;
        height: 100%;
        padding-bottom: 1.25em;
        padding-top: 0.25em;
        display: block;
        position: relative;

        &:after {
          position: absolute;
          content: "";
          width: 18px;
          height: 3px;
          background: transparent;
          bottom: 1em;
          right: 50%;
          margin-right: -9px;
          transition: 100ms ease-in-out background;
        }

        &:hover {
            &:after {
                background: ${colors.orange500};
                transition: 100ms ease-in-out background;
            }
        }

        &.Link--is-active {
            &:after {
                background: ${colors.orange500};
                transition: 100ms ease-in-out background;
            }
        }
    }
`;

const LocaleSwitcher = styled.div`
  text-align: center;
`;

const Header = () => {
  const locale = React.useContext(LocaleContext);
  const i18n = locale.i18n[locale.lang];

  return (
    <HeaderContainer>
      <HeaderContent>
        <LocalizedLink to="/">
          <Logo />
        </LocalizedLink>
        <HeaderLinks>
          <LocalizedLink
            activeClassName="Link--is-active"
            to="/work"
          >
            {i18n.workMenu}
          </LocalizedLink>
          <LocalizedLink
            activeClassName="Link--is-active"
            to="/blog"
          >
            Blog
          </LocalizedLink>

          <LocaleSwitcher data-name="locale-switcher">
            <Link
              hrefLang="en-us"
              lang="en-us"
              to="/en"
              activeClassName="Link--is-active"
              partiallyActive
            >
              EN
            </Link>
            {/* {' '} */}
            {/* / */}
            {/* {' '} */}
            <Link
              hrefLang="es-ec"
              lang="es-ec"
              to="/"
              activeClassName="Link--is-active"
            >
              ES
            </Link>
          </LocaleSwitcher>
        </HeaderLinks>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
