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
`;

export const AccentText = styled(m.div)`
    display: flex;
    font-family: Druk, sans-serif;
    white-space: pre;
    line-height: 1;
    opacity: 0.55;
    position: relative;
    color: ${({ theme }) => theme.palette.base};
    user-select: none;
    height: min-content;
    text-shadow: -4px -4px 40px rgba(206, 206, 206, 0.25);
`;

export const SpacedNum = styled(m.span)`
    font-variant-numeric: tabular-nums;
    display: flex;
    position: relative;
    align-items: flex-end;
    justify-content: center;
    width: 1ch;
`;
