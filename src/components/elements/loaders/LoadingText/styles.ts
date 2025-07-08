'use client';

import styled, { keyframes } from 'styled-components';

const gradient = keyframes`
  0% {
    background-position: 200% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

export const AnimatedGradientText = styled.span`
    background: ${({ theme }) =>
        theme.mode === 'light'
            ? 'linear-gradient(270deg, #000 0%, #B4B4B4 50%, #000 100%)'
            : 'linear-gradient(270deg, #fff 0%, #828282 50%, #fff 100%)'};
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
    animation: ${gradient} 2.5s linear infinite;
    font-weight: inherit;
    font-size: inherit;
    display: inline-block;
`;
