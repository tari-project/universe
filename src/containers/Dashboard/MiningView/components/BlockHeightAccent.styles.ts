import styled from 'styled-components';
import { motion } from 'framer-motion';

export const AccentWrapper = styled(motion.div)`
    position: fixed;
    overflow: hidden;
    pointer-events: none;
    top: 0;
    right: 0;
    height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;
export const Accent = styled(motion.div)<{ $accentHeight?: number }>`
    position: relative;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    top: calc(50% - ${({ $accentHeight = 110 }) => `${$accentHeight / 2}px`});
    transform: translateY(-50%);
    width: ${({ $accentHeight = 110 }) => `${$accentHeight}px`};
`;

export const AccentText = styled(motion.div)<{ $accentHeight?: number }>`
    display: flex;
    align-self: flex-end;
    text-align: center;
    height: max-content;
    font-family: Druk, sans-serif;
    white-space: pre;
    color: ${({ theme }) => theme.palette.base};
    line-height: 1;
    opacity: 0.55;
    position: relative;
    transform: rotate(-90deg);
`;

export const SpacedNum = styled('span')`
    font-variant-numeric: tabular-nums;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: min-content;
    max-width: 1ch;
`;
