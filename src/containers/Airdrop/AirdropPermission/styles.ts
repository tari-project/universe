import styled, { keyframes } from 'styled-components';

export const Position = styled('div')`
    pointer-events: none;

    position: absolute;
    bottom: 20px;
    left: 50%;
    z-index: 2;
    transform: translateX(-50%);

    @media (max-height: 672px) {
        display: none;
    }
`;

export const BoxWrapper = styled('div')`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;

    padding: 20px;

    border-radius: 10px;
    background: #fff;
    box-shadow:
        0 10px 25px -12.5px rgba(0, 0, 0, 0.07),
        0 12.5px 33.33px -16.66px rgba(0, 0, 0, 0.05),
        0 15px 50px -25px rgba(0, 0, 0, 0.035);

    pointer-events: all;
    width: 460px;

    @media (max-width: 974px) {
        width: 380px;
    }
`;

export const TextWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const Title = styled('div')`
    color: #000;
    font-size: 14px;
    font-weight: 600;
    line-height: 110%;
`;

export const Text = styled('span')`
    color: #797979;
    font-size: 12px;
    font-weight: 500;
    line-height: 116.667%;
`;

const float = keyframes`
  0% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-3px) rotate(2.5deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
  }
`;

export const Gem1 = styled('img')`
    position: absolute;
    top: 20px;
    left: -60px;

    animation: ${float} 3s ease-in-out infinite;
`;

export const Gem2 = styled('img')`
    position: absolute;
    top: -25px;
    left: -28px;
    width: 28px;
    rotate: -5deg;

    animation: ${float} 3.2s ease-in-out infinite;
`;

export const Gem3 = styled('img')`
    position: absolute;
    top: -33px;
    left: 4px;
    width: 21px;
    rotate: 40deg;

    animation: ${float} 3.4s ease-in-out infinite;
`;

export const Gem4 = styled('img')`
    position: absolute;
    top: -48px;
    left: -7px;
    width: 13px;
    rotate: -10deg;

    animation: ${float} 3.8s ease-in-out infinite;
`;
