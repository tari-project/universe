import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

export const BoxWrapper = styled(m.div)<{ $boxWidth?: number; $padding?: number }>`
    flex-shrink: 0;
    border-radius: 35px;
    background: linear-gradient(180deg, #c9eb00 32.79%, #fff 92.04%);
    box-shadow: 28px 28px 77px 0 rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 40px;
    max-width: 100%;
    padding: 40px;
    width: clamp(max(40vw, 620px), calc(700px + 2vh), min(60vw, 840px));

    @media (max-height: 900px) {
        gap: 20px;
        padding: 20px;
    }

    ${({ $padding }) =>
        $padding &&
        css`
            padding: ${$padding}px;
        `}
`;

export const CloseButton = styled('button')`
    cursor: pointer;
    position: absolute;
    top: -20px;
    left: 100%;
    margin-left: 5px;
    color: rgba(255, 255, 255, 0.5);
    transition:
        color 0.2s ease,
        transform 0.2s ease;

    &:hover {
        color: #fff;
        transform: scale(1.1);
    }
`;
