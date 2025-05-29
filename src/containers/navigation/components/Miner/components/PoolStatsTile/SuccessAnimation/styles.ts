'use client';

import styled, { keyframes } from 'styled-components';
import * as m from 'motion/react-m';

const floatAnim = keyframes`
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
  100% {
    transform: translateY(0);
  }
`;

export const Wrapper = styled(m.div)`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    border-radius: 12px;

    background: linear-gradient(159deg, #07c9c9 3.14%, #20ff79 146.13%);
`;

export const Text = styled(m.div)`
    font-family: Poppins, sans-serif;
    font-size: 32px;
    font-style: normal;
    font-weight: 600;
    line-height: 14.286%;
    letter-spacing: -1.05px;
    color: #fff;
    text-shadow: 0px 0px 20px rgba(0, 0, 0, 0.15);
`;

export const CoinWrapper = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    z-index: 12;
    width: 100%;
    height: 100%;
`;

export const Coin1Image = styled(m.img)`
    position: absolute;
    left: -40px;
    top: -48px;
`;

export const Coin2Image = styled(m.img)`
    position: absolute;
    left: -20px;
    top: 10px;
`;

export const Coin3Image = styled(m.img)`
    position: absolute;
    left: -10px;
    top: -20px;
`;

export const Coin4Image = styled(m.img)`
    position: absolute;
    right: -20px;
    top: 10px;
`;

export const Coin5Image = styled(m.img)`
    position: absolute;
    right: -60px;
    top: -20px;
`;

export const Coin6Image = styled(m.img)`
    position: absolute;
    right: -20px;
    top: -45px;
`;

export const Float = styled(m.div)<{ delay?: number }>`
    animation: ${floatAnim} 2.5s ease-in-out infinite;
    animation-delay: ${({ delay }) => (delay ? `${delay}s` : '0s')};
`;
