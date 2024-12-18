import styled, { css, keyframes } from 'styled-components';

export const TextWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 15px;

    padding-top: 130px;
`;

export const Title = styled('div')`
    color: #000;
    text-align: center;
    font-size: 32px;
    font-style: normal;
    line-height: 99.7%;
    text-transform: uppercase;
    font-family: DrukWide, sans-serif;
    font-weight: 800;

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
    font-size: 16px;
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
            min-height: 70px;
            font-weight: bold;
            background: rgba(255, 255, 255, 0.1);
        `};
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
    aspect-ratio: 501 / 313;
    width: 501px;
    margin: auto;
    margin-bottom: 14px;

    position: absolute;
    top: -120px;
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

export const ClaimButton = styled('button')`
    transition: transform 0.2s ease;
    text-transform: uppercase;
    color: #c9eb00;
    font-size: 21px;
    text-align: center;
    font-family: DrukWide, sans-serif;
    font-weight: 800;
    width: 100%;
    border-radius: 49px;
    background: #000;
    box-shadow: 28px 28px 77px 0px rgba(0, 0, 0, 0.1);
    min-height: 70px;

    position: relative;
    cursor: pointer;

    &:hover {
        transform: scale(1.05);
    }
`;

export const ActionWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
`;

export const TextButton = styled('button')`
    text-transform: uppercase;
    color: black;
    font-size: 16px;
    text-align: center;
    font-family: Poppins, sans-serif;

    position: relative;
    font-weight: bold;
    text-align: center;
    margin-bottom: 15px;
    width: fit-content;
    &:hover {
        text-decoration: underline;
    }
`;

export const InputWrapper = styled('div')`
    width: 100%;
    position: relative;
`;

export const InputLabel = styled('div')`
    position: absolute;
    left: 40px;
    top: 16px;

    color: #797979;
    font-size: 12px;
    font-weight: 500;
    pointer-events: none;
`;

export const StyledInput = styled('input')`
    height: 75px;
    width: 100%;
    border-radius: 49px;
    border: 1px solid #e0e0e0;
    background: rgba(241, 241, 241, 0.5);
    box-shadow: 28px 28px 77px 0px rgba(0, 0, 0, 0.1);

    padding: 18px 100px 0 40px;
    transition:
        background 0.2s ease,
        border 0.2s ease;

    &::placeholder {
        color: rgba(0, 0, 0, 0.5);
    }

    &:focus {
        background-color: ${({ theme }) => theme.palette.background.accent};
        border: 1px solid #b0b0b0;
    }
`;

export const InputGems = styled('div')`
    position: absolute;
    right: 20px;
    bottom: 20px;

    display: flex;
    height: 35.065px;
    padding: 10.39px 15.584px 10.39px 20.779px;
    justify-content: center;
    align-items: center;
    gap: 3.896px;

    border-radius: 206.233px;
    background: linear-gradient(0deg, #000 0%, #000 100%), linear-gradient(180deg, #755cff 0%, #2946d9 100%),
        linear-gradient(180deg, #ff84a4 0%, #d92958 100%);

    pointer-events: none;

    color: #fff;
    font-size: 16px;
    font-weight: 600;

    img {
        transform: rotate(45deg) translateY(-1px);
    }
`;

export const XLogo = styled('div')`
    width: 48px;
    height: 48px;
    border-radius: 100%;

    display: flex;
    align-items: center;
    justify-content: center;

    background-color: ${({ theme }) => theme.palette.background.accent};
    color: #000;

    position: absolute;
    top: 50%;
    right: 16px;

    transform: translateY(-50%);
`;

export const FinePrint = styled('div')`
    color: #000;
    text-align: center;
    font-size: 13px;
    font-style: normal;
    font-weight: 400;
    line-height: 120.7%;

    padding-top: 4px;

    strong {
        font-weight: 700;
    }
`;
