import React from 'react';
import styled from '@emotion/styled';
import colors from '../styles/colors';
import spooch from '../images/oscar-icon.png';
import LocalizedLink from './LocalizedLink';
import logo from '../images/logo-face-only.png';

const FooterContainer = styled('div')`
    padding-top: 3em;
    padding-bottom: 3em;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .FooterLogo {
        max-width: 80px;
    }

    svg {
        max-width: 50px;
    }
`;

const FooterAuthor = styled('a')`
    font-size: 0.75em;
    color: ${colors.grey700};
    display: flex;
    flex-direction: column;
    align-items: center;
    text-decoration: none;
    margin-top: 1.5em;

     &:hover {
         color: ${colors.blue900};

        .FooterSpooch {
            animation-name: rotate;
            animation-duration: 1.5s;
            animation-iteration-count: infinite;
            animation-timing-function: linear;
        }
    }

    @keyframes rotate {
        from {transform: rotate(0deg);}
        to {transform: rotate(360deg);}
    }
`;

const FooterSpooch = styled('img')`
    max-width: 33px;
    margin-top: 0.25em;
`;

const Footer = () => (
  <FooterContainer>
    <LocalizedLink to="/">
      <img src={logo} className="FooterLogo" alt="The Dveloper logo" />
      {/* <Logo /> */}
    </LocalizedLink>
    <FooterAuthor href="https://marguerite.io">
      © 2020 — Base template by Marguerite Roth
      <FooterSpooch className="FooterSpooch" src={spooch} />
    </FooterAuthor>
  </FooterContainer>
);

export default Footer;
