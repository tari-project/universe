import styled from 'styled-components';
import { motion } from 'framer-motion';

export const AccentWrapper = styled(motion.div)`
    overflow: hidden;
    pointer-events: none;
    top: 0;
    right: -20px;
    height: 100%;
    position: absolute;
    align-items: center;
    display: flex;
`;

export const AccentText = styled(motion.div)`
    display: flex;
    text-align: center;
    font-family: Druk, sans-serif;
    white-space: pre;
    line-height: 1;
    opacity: 0.55;
    right: 0;
    position: relative;
    color: ${({ theme }) => theme.palette.base};
    max-height: min-content;
`;

export const SpacedNum = styled(motion.span)`
    font-variant-numeric: tabular-nums;
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
    width: min-content;
    max-width: 1ch;
`;
