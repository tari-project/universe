import styled, { css, keyframes } from 'styled-components';

export const Wrapper = styled.div`
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
    gap: 20px;
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
    aspect-ratio: 226 / 125;
    width: 226px;
    margin: auto;
    margin-bottom: 14px;

    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;

    @media (max-height: 800px) {
        width: 80%;
        top: -90px;
        transform: scale(0.7) translateX(-71%);
    }
`;

export const Gem1 = styled('img')`
    position: absolute;
    top: 0;
    left: 0;
    animation: ${float} 3s ease-in-out infinite;
    width: 111px;
    rotate: -40deg;
`;

export const Gem2 = styled('img')`
    position: absolute;
    top: 30px;
    right: 60px;

    width: 32px;
    rotate: -40deg;
    animation: ${float} 3.2s ease-in-out infinite;
`;

export const Gem3 = styled('img')`
    position: absolute;
    bottom: 10px;
    right: 0px;
    width: 70px;
    rotate: 15deg;
    animation: ${float} 3.8s ease-in-out infinite;
`;

export const TextWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;

    padding-top: 80px;
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
`;

export const Text = styled('div')<{ $isError?: boolean }>`
    color: #000;
    text-align: center;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 120.7%;

    max-width: 468px;

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

export const ClaimButton = styled('button')`
    transition: transform 0.2s ease;
    text-transform: uppercase;
    color: #c9eb00;
    font-size: 14px;
    text-align: center;
    font-family: DrukWide, sans-serif;
    font-weight: 800;
    width: 100%;
    border-radius: 60px;
    background: #000;
    box-shadow: 28px 28px 77px 0px rgba(0, 0, 0, 0.1);
    min-height: 45px;

    position: relative;
    cursor: pointer;

    &:hover {
        transform: scale(1.05);
    }
`;
