import styled, { css, keyframes } from 'styled-components';
import { m } from 'motion/react';
import { convertHexToRGBA } from '@app/utils';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(50px) scale(1.1);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const widthIn = keyframes`
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
`;

export const Container = styled(m.div)`
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 100%;
    z-index: 2;
`;

export const Heading = styled.div<{ $step: number }>`
    font-weight: 700;
    font-size: calc(2.6rem + 1vmin);
    color: ${({ theme }) => theme.palette.text.primary};
    text-transform: uppercase;
    line-height: 1;
    letter-spacing: -2px;
    white-space: pre-line;

    ${({ $step }) => {
        if ($step === 1) {
            return css`
                max-width: 410px;
            `;
        }
    }}
`;

export const Copy = styled.div`
    font-size: min(calc(1rem + 1vmin), 30px);
    line-height: 1.2;
    letter-spacing: -0.8px;
    max-width: 520px;
`;

export const AnimatedTextContainer = styled.div`
    height: max-content;
    opacity: 0;
    animation: ${fadeIn} 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
    will-change: transform, opacity;

    span {
        white-space: pre;
        display: inline-block;
        opacity: 0;
        animation: ${fadeIn} 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
        will-change: transform, opacity;
    }
`;

export const AnimatedSpan = styled.span<{ $index: number }>`
    animation-delay: ${({ $index }) => $index * 0.025}s !important;
`;

export const NavContainer = styled.div`
    grid-area: content;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: clamp(240px, 38vh, 340px);
`;

export const Nav = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
    position: relative;
    z-index: 2;
    height: 10px;
`;

export const NavItem = styled.div`
    position: relative;
    display: flex;
    width: 70px;
    height: 5px;
    cursor: pointer;
    overflow: hidden;

    background: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};
    border-radius: 200px;

    transition:
        background 0.2s ease,
        height 0.2s ease;
    will-change: background, height;

    &:hover {
        background: rgba(0, 0, 0, 0.2);
        height: 10px;
    }
`;

export const NavItemCurrent = styled.div<{ $duration?: number }>`
    border-radius: 200px;
    height: 100%;
    z-index: 1;
    background: ${({ theme }) => theme.palette.base};
    animation: ${widthIn} ${({ $duration = 0.3 }) => $duration}s linear forwards;
    will-change: width, opacity;
`;

export const GraphicContainer = styled(m.div)`
    position: fixed;
    pointer-events: none;
    width: 40vw;
    bottom: 0;
    right: -20px;
    height: 95vh;
    display: flex;
    align-items: end;
    justify-content: flex-end;
    z-index: 1;
    transition: height 0.3s ease;

    @media (max-width: 1200px) and (min-height: 850px) {
        height: 70vh;
    }
`;

export const StepImg = styled.img<{ $index: number }>`
    max-height: 100%;
    position: absolute;
    bottom: 0;
    right: 0;
    pointer-events: none;
    opacity: 0;
    animation: ${slideIn} 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    will-change: transform, opacity;
`;
