import styled, { css } from 'styled-components';
import * as m from 'motion/react-m';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

const SLIDER_THUMB_WIDTH = 20;
export const Wrapper = styled.div<{ $isLoading?: boolean }>`
    display: grid;
    grid-template-columns: min(6%, 45px) auto min(6%, 45px);
    width: 100%;
    touch-action: none;
    user-select: none;
    place-items: stretch;

    ${({ $isLoading }) =>
        $isLoading &&
        css`
            cursor: wait;
        `}
`;

export const SliderWrapper = styled(m.div)<{ $isLoading?: boolean }>`
    display: flex;
    width: 100%;
    touch-action: none;
    user-select: none;
    align-items: center;
    justify-content: center;
    position: relative;

    ${({ $isLoading }) =>
        $isLoading &&
        css`
            pointer-events: none;
        `}
`;

export const Slider = styled.div`
    position: relative;
    display: flex;
    width: 100%;
    max-width: calc(100% - 16px);
    flex-grow: 1;
    cursor: grab;
    touch-action: none;
    user-select: none;
    align-items: center;
    height: 7px;

    &:active {
        cursor: grabbing;
    }
`;

export const TrackWrapper = styled(m.div)`
    display: flex;
    position: relative;
    flex-grow: 1;
`;

export const Track = styled.div`
    position: relative;
    height: 100%;
    flex-grow: 1;
    overflow: hidden;
    border-radius: 9999px;
    background-color: ${({ theme }) => theme.palette.background.accent};
`;
export const Range = styled(m.div)`
    position: absolute;
    height: 100%;
    background-color: #813bf5;
    border-radius: 9999px;
`;

export const Thumb = styled(m.div)`
    width: ${SLIDER_THUMB_WIDTH}px;
    height: ${SLIDER_THUMB_WIDTH}px;
    z-index: 5;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.palette.background.main};
    border: 2px solid #813bf5;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
`;

export const ValueIndicator = styled(m.div)`
    display: flex;
    color: #fff;
    justify-content: center;
    align-items: center;
    transform: translateX(-50%) translateZ(0) translateY(-50%);
    background: #813bf5;
    position: absolute;
    min-width: 20px;
    padding: 2px 8px;
    border-radius: 5px;
    min-height: 20px;
    top: -${SLIDER_THUMB_WIDTH + 10}px;
    z-index: 2;
    transition: all 0.2s;
    &::after {
        content: '';
        position: absolute;
        bottom: -2px;
        width: 8px;
        height: 8px;
        background: #813bf5;
        left: 50%;
        transform: translateX(-50%) rotate(55deg) skew(20deg);
        z-index: -1;
    }
`;

export const RangeLimits = styled(Typography)`
    font-size: 16px;
    font-weight: 500;
    text-align: center;
`;

export const PerformanceMarker = styled.div<{ $red?: boolean }>`
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    z-index: 3;
    top: 50%;
    transform: translateY(-50%);
    background: #62cc32;
    left: 15%;
    ${({ $red }) =>
        $red &&
        css`
            background: #ff0000;
            left: 75%;
        `}
`;

export const PowerLeveltemWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    border-bottom: 1px solid ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.03)};
    padding: 4px 0 20px;
`;
