'use client';

import { m } from 'motion/react';
import styled, { keyframes } from 'styled-components';

const float = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0); }
`;

export const Wrapper = styled(m.div)`
    width: 100%;

    display: flex;
    justify-content: center;
    align-items: center;

    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    z-index: 2;

    border-radius: 10px;
    border: 1px solid rgba(144, 144, 144, 0.2);
    background: linear-gradient(113deg, #37754f 3.91%, #338554 99.64%);

    color: #fff;
`;

export const MiddleText = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateY(3px);
    position: relative;
    z-index: 1;
`;

export const Eyebrow = styled(m.div)`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
    line-height: 1;
`;

export const NumberGroup = styled(m.div)`
    display: flex;
    align-items: flex-end;
`;

export const Number = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 26px;
    font-style: normal;
    font-weight: 700;
    line-height: normal;
`;

export const Unit = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 700;
    line-height: normal;
    transform: translateY(-4px) translateX(3px);
`;

export const Coins = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;

    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;

    z-index: 0;
    width: 100%;
    height: 100%;
`;

export interface CoinPosition {
    $top?: string;
    $left?: string;
    $right?: string;
    $bottom?: string;
    $width: string;
}
export const Coin = styled(m.div)<CoinPosition>`
    position: absolute;
    width: ${({ $width }) => $width};
    top: ${({ $top }) => $top ?? 'auto'};
    left: ${({ $left }) => $left ?? 'auto'};
    right: ${({ $right }) => $right ?? 'auto'};
    bottom: ${({ $bottom }) => $bottom ?? 'auto'};
`;

export const CoinImage = styled(m.img)<{ $animationDelay?: string }>`
    width: 100%;
    height: 100%;

    animation: ${float} 5s ease-in-out infinite;
    animation-delay: ${({ $animationDelay }) => $animationDelay ?? '0s'};
`;
