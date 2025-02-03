import styled from 'styled-components';
import { m } from 'motion/react';

export const AccentWrapper = styled(m.div)`
    overflow: hidden;
    pointer-events: none;
    height: 100%;
    position: fixed;
    align-items: center;
    justify-content: center;
    display: flex;
    top: 0;
    right: -30px;
`;

export const AccentText = styled(m.div)`
    display: flex;
    font-family: DrukWide, sans-serif;
    font-weight: 800;
    white-space: pre;
    line-height: 1;
    opacity: 0.55;
    position: relative;
    color: ${({ theme }) => (theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.095)' : 'rgba(255, 255, 255, 0.4)')};
    user-select: none;
    height: min-content;
    rotate: -90deg;
    font-size: 16px;
`;

export const SpacedNum = styled.span<{ $isDec?: boolean }>`
    font-variant-numeric: tabular-nums;
    display: flex;
    position: relative;
    align-items: flex-end;
    justify-content: center;
    opacity: 0.6;
    mix-blend-mode: multiply;
    width: ${({ $isDec }) => ($isDec ? 'min-content' : '1ch')};
`;
