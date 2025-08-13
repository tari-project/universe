import * as m from 'motion/react-m';
import styled, { keyframes } from 'styled-components';

const highlightAnimation = keyframes`
    0% {
        width: 0;
    }
    100% {
        width: 100%;
    }
`;

export const EarningsContainer = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding-top: 20%;
    padding-left: 20px;
    text-shadow:
        0px 0px 20px rgba(255, 255, 255, 1),
        0px 0px 2px rgba(255, 255, 255, 1);
`;

export const RecapText = styled(m.div)`
    display: flex;
    gap: 5px;
    font-family: DrukWide, sans-serif;
    font-weight: 800;
    font-size: 22px;
    text-transform: uppercase;
    text-align: center;
    letter-spacing: -0.3px;

    span {
        background: transparent;
        display: flex;
        padding: 1px 6px;
        position: relative;
        text-shadow: none;
        transform: translateY(-1px);

        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 0%;
            height: 100%;
            background: #c2d41a;
            will-change: width;
            animation: ${highlightAnimation} 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            animation-delay: 0.8s;
            z-index: -1;
            box-shadow:
                0px 0px 20px rgba(255, 255, 255, 0.5),
                0px 0px 2px rgba(255, 255, 255, 0.5);
        }
    }

    @media (max-width: 1200px) {
        font-size: 16px;
    }
`;

export const WinText = styled.div`
    text-transform: uppercase;
    display: flex;
    font-family: DrukWide, sans-serif;
    font-weight: 800;
    font-size: 14px;
    letter-spacing: -0.1px;
    white-space: pre;

    @media (max-width: 1200px) {
        font-size: 12px;
    }
`;

export const WinWrapper = styled(m.div)`
    align-items: center;
    display: flex;
    flex-direction: row;
`;

export const AmtWrapper = styled.div`
    font-size: 70px;
    line-height: 1;
    display: flex;
    letter-spacing: 1px;
    font-family: DrukWide, sans-serif;
    font-weight: 900;
    padding: 0 5px 0 10px;
    text-transform: lowercase;
    transform: translateY(-5px);

    @media (max-width: 1200px) {
        font-size: 60px;
    }
`;

export const EarningsWrapper = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: flex-end;
    position: relative;
`;
