import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';
import backgroundImage from './images/background.png';

export const StartWrapper = styled(m.button)`
    position: relative;
    border-radius: 500px;
    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    justify-content: center;

    background-color: #188750;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-image: url(${backgroundImage});

    box-shadow: 0px 0px 10px 0px rgba(104, 153, 55, 0.35);

    .start-text {
        transition: transform 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87);
    }

    .play-icon {
        transition: background-color 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87);
    }

    &:hover {
        .start-text {
            transform: scale(1.05);
        }

        .play-icon {
            background: rgba(255, 255, 255, 0.3);
        }
    }

    &:active {
        .start-text {
            transform: scale(1);
        }
    }
`;

export const Text = styled.span`
    color: #f0f1f1;
    text-align: center;

    font-family: Poppins, sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 600;
    line-height: 110%;
    letter-spacing: -0.48px;
`;

export const IconWrapper = styled.div<{ $absolute?: boolean }>`
    width: 27px;
    height: 27px;

    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    border-radius: 100%;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(17px);

    ${({ $absolute }) =>
        $absolute &&
        css`
            position: absolute;
            top: 50%;
            left: 14px;
            transform: translateY(-50%);
        `}
`;
