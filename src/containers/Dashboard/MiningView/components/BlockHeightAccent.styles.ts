import styled from 'styled-components';
import { motion } from 'framer-motion';

export const AccentWrapper = styled(motion.div)`
    overflow: hidden;
    pointer-events: none;
    height: 100%;
    position: absolute;
    align-items: center;
    justify-content: center;
    display: flex;
`;

export const AccentText = styled(motion.div)`
    display: flex;
    font-family: Druk, sans-serif;
    white-space: pre;
    line-height: 1;
    opacity: 0.55;
    position: relative;
    color: ${({ theme }) => theme.palette.base};
    user-select: none;
    height: min-content;
`;

export const SpacedNum = styled(motion.span)`
    font-variant-numeric: tabular-nums;
    display: flex;
    position: relative;
    align-items: flex-end;
    justify-content: center;
    width: 1ch;
`;
