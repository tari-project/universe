import styled, { css } from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import * as m from 'motion/react-m';
import { keyframes } from 'styled-components';

export const Wrapper = styled.div`
    width: 100%;
    position: relative;
`;

export const Border = styled.div<{ $isLoading?: boolean; $isMining?: boolean }>`
    width: 100%;
    overflow: hidden;
    padding: 2px;
    border-radius: 12px;
    position: relative;
`;

export const Inside = styled.div<{ $isLoading?: boolean; $isMining?: boolean }>`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;

    background: linear-gradient(99deg, #fff 8.49%, #e4fdf8 100.54%), #fff;

    ${({ theme }) =>
        theme.mode === 'dark' &&
        css`
            background: linear-gradient(99deg, #1a2d28 8.49%, #233c34 100.54%), #1a2d28;
        `}

    ${({ $isMining, theme }) =>
        $isMining &&
        css`
            background: linear-gradient(99deg, #fff 8.49%, #e4fdf8 100.54%), #fff;
            ${theme.mode === 'dark' &&
            css`
                background: linear-gradient(99deg, #1a2d28 8.49%, #233c34 100.54%), #1a2d28;
            `}
        `}

    ${({ $isLoading, theme }) =>
        $isLoading &&
        css`
            background: linear-gradient(99deg, #fffdf7 8.49%, #ffefc7 100.54%);
            ${theme.mode === 'dark' &&
            css`
                background: linear-gradient(99deg, #3a2d1a 8.49%, #4d3a1a 100.54%), #3a2d1a;
            `}
        `}

    color: ${({ theme }) => theme.palette.text.accent};
    border-radius: 10px;

    font-size: 12px;
    font-weight: 500;
    flex-shrink: 0;
    flex-grow: 6;
    padding: 14px;
    height: 62px;
    position: relative;
    z-index: 2;
`;

const spin = keyframes`
  100% {
    transform: translate(-50%, -50%) rotate(-360deg);
  }
`;

export const AnimatedGradient = styled.div<{ $isLoading?: boolean; $isMining?: boolean }>`
    width: 400%;
    aspect-ratio: 1 / 2;

    background: #c3ebdb;

    ${({ theme }) =>
        theme.mode === 'dark' &&
        css`
            background: #1a2d28;
        `}

    ${({ $isMining, theme }) =>
        $isMining &&
        css`
            background: conic-gradient(
                from 0deg,
                ${theme.mode === 'dark' ? '#1a5c3a' : '#33cd7e'} 0deg,
                ${theme.mode === 'dark' ? '#3a7c5a' : '#b5dac9'} 360deg
            );
            animation: ${spin} 3s linear infinite;
        `}

    ${({ $isLoading, theme }) =>
        $isLoading &&
        css`
            background: conic-gradient(
                from 0deg,
                ${theme.mode === 'dark' ? '#4d3a1a' : '#FFD8B0'} 0deg,
                ${theme.mode === 'dark' ? '#b38c4d' : '#FFF3E0'} 360deg
            );
        `}

    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
`;

export const LeftContent = styled.div`
    display: flex;
    height: 100%;
    justify-content: space-between;
    flex-direction: column;

    position: relative;
    z-index: 2;
`;

export const RightContent = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 4px;
    align-items: end;
    height: 100%;
    position: relative;

    z-index: 2;
`;

export const Values = styled.div`
    display: flex;
    align-items: baseline;
    gap: 4px;
`;

export const Title = styled(Typography).attrs({ variant: 'h6' })`
    font-size: 12px;
    width: 100%;
    line-height: 1.1;
`;

export const BalanceVal = styled(Typography)`
    font-size: 18px;
    color: ${({ theme }) => theme.palette.text.primary};
    vertical-align: bottom;
    letter-spacing: -0.4px;
`;

export const TriggerWrapper = styled(m.div)`
    width: 14px;
    height: 14px;
    background: ${({ theme }) => theme.palette.contrast};
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;
    color: ${({ theme }) => theme.palette.base};

    transform: translateX(0px) translateY(-4px);
`;

export const ExpandedWrapper = styled.div``;

export const ExpandedBox = styled(m.div)`
    display: flex;
    background-color: ${({ theme }) => theme.palette.background.default};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    box-shadow: 2px 8px 8px 0 rgba(0, 0, 0, 0.04);
    flex-direction: column;
    gap: 6px;
    min-width: 340px;
    padding: 15px;
    h5,
    strong {
        margin: 0;
        color: ${({ theme }) => theme.palette.text.primary};
    }
`;

export const TooltipChipWrapper = styled.div`
    display: flex;
    padding: 4px 0 0 0;
    flex-direction: row;
    gap: 6px;
`;

export const TooltipChip = styled.div`
    display: flex;
    color: ${({ theme }) => theme.palette.text.contrast};
    background-color: ${({ theme }) => theme.palette.contrast};
    flex-direction: column;
    border-radius: 10px;
    padding: 10px 10px 6px 10px;
    flex-shrink: 1;
    flex-grow: 2;
    width: 100%;
`;

export const TooltipChipHeading = styled(Typography).attrs({ variant: 'p' })`
    white-space: nowrap;
    color: ${({ theme }) => theme.palette.text.secondary};
    font-weight: 500;
`;

export const TooltipChipText = styled(Typography).attrs({ variant: 'p' })`
    color: ${({ theme }) => theme.palette.text.contrast};
    font-size: 18px;
    font-weight: 500;
    letter-spacing: 1px;
    line-height: 1.1;
    height: 27px;
    display: flex;
    align-items: center;
`;
