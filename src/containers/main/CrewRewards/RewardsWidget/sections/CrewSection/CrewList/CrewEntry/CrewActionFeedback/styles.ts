import styled, { keyframes } from 'styled-components';
import * as m from 'motion/react-m';

const wave = keyframes`
    0% {
        transform: rotate(-10deg);
    }
    25% {
        transform: rotate(10deg);
    }
    50% {
        transform: rotate(-5deg);
    }
    75% {
        transform: rotate(5deg);
    }
    100% {
        transform: rotate(0deg);
    }
`;

export const Wrapper = styled(m.div)<{ $isNudge?: boolean }>`
    position: absolute;
    inset: 0;
    z-index: 1;

    background-color: ${({ $isNudge }) => ($isNudge ? '#ff720e' : '#01A405')};
    border-radius: 10px;
    padding: 10px;
    font-size: 14px;
    font-weight: 600;
    line-height: 14px;
    color: #fff;

    display: flex;
    align-items: center;
    justify-content: center;

    cursor: pointer;

    svg {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        animation: ${wave} 0.6s ease-in-out infinite;
    }
`;

export const InsideText = styled(m.div)`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
`;
