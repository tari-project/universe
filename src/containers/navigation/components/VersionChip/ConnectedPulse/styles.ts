import styled, { css, keyframes } from 'styled-components';

const pulse = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
`;

export const Wrapper = styled('div')<{ $size: number }>`
    position: relative;
    width: ${({ $size }) => $size * 2}px;
    height: ${({ $size }) => $size * 2}px;
`;

export const Dot = styled('div')<{ $isConnected: boolean; $size: number }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    background-color: #31eeaa;
    border-radius: 50%;

    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    ${({ $isConnected }) =>
        !$isConnected &&
        css`
            background-color: #f3c11c;
        `}
`;

export const Pulse = styled('div')<{ $isConnected: boolean }>`
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #31eeaa;
    animation: ${pulse} 2s infinite;

    ${({ $isConnected }) =>
        !$isConnected &&
        css`
            background-color: #f3c11c;
        `}
`;
