import { m } from 'framer-motion';
import styled, { keyframes } from 'styled-components';

export const Wrapper = styled(m.div)`
    position: fixed;
    top: 47px;
    right: 40px;
    z-index: 4;

    width: 311px;

    border-radius: 19.438px;
    background: linear-gradient(180deg, #c9eb00 32.79%, #fff 69.42%);
    box-shadow: 15.55px 15.55px 42.763px 0px rgba(0, 0, 0, 0.1);

    padding: 10px;

    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const float = keyframes`
  0% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-5px) rotate(2.5deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
  }
`;

export const GemsWrapper = styled('div')`
    width: 100%;
    height: 134px;
    margin: auto;

    position: absolute;
    top: -44px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;

    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) calc(100% - 40px), rgba(0, 0, 0, 0));
`;

export const GiftImage = styled('img')`
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
`;

export const GemImage = styled('img')`
    position: absolute;
    animation: ${float} 3s ease-in-out infinite;
`;

export const TextWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;

    padding-top: 86px;
`;

export const Title = styled('div')`
    color: #000;
    text-align: center;
    font-family: DrukWide, sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 800;
    line-height: 99.7%;
    text-transform: uppercase;
    max-width: 222px;

    span {
        color: #ff4a55;
    }
`;

export const Text = styled('div')<{ $isError?: boolean }>`
    color: #000;
    text-align: center;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 120.7%;
    max-width: 282px;
`;

export const ClaimButton = styled('button')`
    color: #c9eb00;

    font-size: 14px;
    text-align: center;
    font-family: DrukWide, sans-serif;
    font-weight: 800;
    text-transform: uppercase;

    border-radius: 60px;
    background: #000;
    box-shadow: 28px 28px 77px 0px rgba(0, 0, 0, 0.1);

    width: 100%;
    height: 45px;

    position: relative;
    cursor: pointer;

    span {
        display: block;
        transition: transform 0.2s ease;
    }

    &:hover {
        span {
            transform: scale(1.075);
        }
    }
`;
