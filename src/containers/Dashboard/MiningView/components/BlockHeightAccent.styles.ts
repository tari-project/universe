import styled from 'styled-components';
import { m } from 'framer-motion';

export const AccentWrapper = styled(m.div)`
    overflow: hidden;
    pointer-events: none;
    height: 100%;
    position: absolute;
    align-items: center;
    justify-content: center;
    display: flex;

    top: 0;
    right: -40px;
`;

export const AccentText = styled(m.div)`
    display: flex;
    font-family: DrukWide, sans-serif;
    white-space: pre;
    line-height: 1;
    opacity: 0.55;
    position: relative;
    color: rgba(255, 255, 255, 0.4);
    user-select: none;
    height: min-content;
`;

export const SpacedNum = styled(m.span)<{ $isDec?: boolean }>`
    font-variant-numeric: tabular-nums;
    display: flex;
    position: relative;
    align-items: flex-end;
    justify-content: center;

    opacity: 0.6;
    mix-blend-mode: multiply;

    width: ${({ $isDec }) => ($isDec ? 'min-content' : '1ch')};
`;
