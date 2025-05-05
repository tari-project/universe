import { Typography } from '@app/components/elements/Typography';
import styled, { css, keyframes } from 'styled-components';

export const Wrapper = styled.div`
    pointer-events: all;
    position: absolute;
    top: 0;
    right: -10px; // 10px offsets for container padding
    transform: translate(0, -10px);
    background-color: rgba(0, 0, 0, 0);
    width: calc(100% + 20px);
    height: calc(100% + 20px);
    margin: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    z-index: 2;
`;

export const SubTitle = styled(Typography)`
    max-width: 700px;
    font-weight: 400;
    font-size: 18px;
    line-height: 22px;

    text-align: center;
`;

export const HeaderImgSevere = styled.img`
    width: min(660px, 100vh);
    max-width: 100%;
`;

export const HeaderImg = styled.img`
    width: min(460px, 100vh);
    max-width: 100%;
`;

export const TelegramLogo = styled.img`
    padding-left: 5px;
    display: inline-block;
`;

// Define the keyframes for the shine animation
const shine = keyframes`
  0% {
    transform: translateX(-100%) skewX(-25deg); // Start off screen left, skewed
  }
  100% {
    transform: translateX(200%) skewX(-25deg); // Move across and off screen right, skewed
  }
`;

export const RetryTimer = styled.div`
    display: inline-block;
    border-radius: 50px;
    padding: 15px 30px;
    background: linear-gradient(to right, #ffaf40, #ff825f);
    color: white;
    box-shadow: 0 0 34px 0 rgba(255, 213, 167, 0.75);
    position: relative; // Needed for pseudo-element positioning
    overflow: hidden; // Needed to clip the shine effect

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 50%; // Width of the shine element
        height: 100%;
        background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            // Transparent start
            rgba(255, 255, 255, 0.4) 50%,
            // White shine in the middle
            rgba(255, 255, 255, 0) 100% // Transparent end
        );
        transform: translateX(-100%) skewX(-25deg); // Initial position off-screen left
        animation: ${shine} 2s infinite linear; // Apply the animation
    }
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    color: ${({ theme }) => theme.palette.text.primary};
    margin-bottom: 20px;
    align-items: center;
`;

export const SecondaryButton = styled(Typography)<{ $isActive?: boolean }>`
    display: inline-block;
    width: fit-content;
    cursor: ${(props) => (props.$isActive ? 'pointer' : 'default')};
    color: ${({ theme }) => theme.palette.text.primary};

    font-weight: 600;
    font-size: 18px;
    line-height: 22px;

    text-align: center;
    opacity: ${(props) => (props.$isActive ? 0.5 : 0.2)};
    transition: opacity 0.2s ease-in-out; // Optional: add a smooth transition

    ${(props) =>
        props.$isActive &&
        css`
            &:hover {
                opacity: 0.8; // Example hover effect for active state
            }
        `}
`;
