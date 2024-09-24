import { m } from 'framer-motion';
import styled, { css, keyframes } from 'styled-components';

export const Wrapper = styled('div')`
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 99999;

    display: flex;
    justify-content: center;
    align-items: center;

    pointer-events: all;
`;

export const Cover = styled(m.div)`
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 0;
    cursor: pointer;
`;

export const BoxWrapper = styled(m.div)`
    width: 100%;
    max-width: 560px;
    flex-shrink: 0;

    min-height: 479px;

    border-radius: 35px;
    background: linear-gradient(180deg, #c9eb00 32.79%, #fff 69.42%);
    box-shadow: 28px 28px 77px 0px rgba(0, 0, 0, 0.1);

    position: relative;
    z-index: 1;

    padding: 0 15px 22px 15px;

    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 40px;
`;

export const TextWrapper = styled('div')`
    padding: 0px 34px;

    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 15px;
`;

export const Title = styled('div')`
    color: #000;
    text-align: center;
    font-size: 28px;
    font-style: normal;
    font-weight: 800;
    line-height: 99.7%;
    text-transform: uppercase;
    font-family: Druk, sans-serif;

    max-width: 462px;

    span {
        color: #ff4a55;
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }
`;

export const Text = styled('div')<{ $isError?: boolean }>`
    color: #000;
    text-align: center;
    font-size: 20px;
    font-style: normal;
    font-weight: 400;
    line-height: 120.7%;

    max-width: 410px;

    ${({ $isError }) =>
        $isError &&
        css`
            font-weight: bold;
            margin-top: 10px;
            font-size: 14px;
            text-transform: uppercase;
            max-width: unset;
            color: red;
        `};
`;

export const GemTextImage = styled('img')`
    width: 22px;
    transform: translateY(1px);
`;

export const ShareWrapper = styled('div')<{ $isClaim?: boolean }>`
    width: 100%;
    border-radius: 49px;
    background: #000;
    box-shadow: 28px 28px 77px 0px rgba(0, 0, 0, 0.1);

    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    padding-left: 36px;
    gap: 10px;

    position: relative;
    ${({ $isClaim }) =>
        $isClaim &&
        css`
            font-weight: bold;
            background: white;
        `};
`;

export const ShareText = styled('div')`
    color: #c9eb00;
    font-size: 18px;
    font-style: normal;
    font-weight: 600;
    line-height: 99.7%;
`;

export const CopyButton = styled('button')`
    width: 113px;
    height: 51px;
    flex-shrink: 0;

    border-radius: 100px;
    background: #fff;

    color: #000;
    font-size: 18px;
    font-style: normal;
    font-weight: 600;
    line-height: 99.7%;

    display: flex;
    justify-content: center;
    align-items: center;

    cursor: pointer;
    position: relative;

    .copytext {
        display: inline-block;
        transition: transform 0.2s;
    }

    &:hover {
        .copytext {
            transform: scale(1.1);
        }
    }
`;

export const CopyText = styled(m.span)``;

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
    aspect-ratio: 501 / 313;
    width: 501px;
    margin: auto;
    margin-bottom: 14px;

    position: absolute;
    top: -120px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
`;

export const Gem1 = styled('img')`
    position: absolute;
    top: 0;
    left: 0;
    animation: ${float} 3s ease-in-out infinite;
`;

export const Gem2 = styled('img')`
    position: absolute;
    top: 0;
    right: 90px;

    width: 102px;
    rotate: -10deg;
    animation: ${float} 3.2s ease-in-out infinite;
`;

export const Gem3 = styled('img')`
    position: absolute;
    bottom: 40px;
    right: 40px;
    width: 182px;
    rotate: 45deg;
    animation: ${float} 3.8s ease-in-out infinite;
`;
