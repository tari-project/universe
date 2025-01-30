import { m } from 'framer-motion';
import styled, { css } from 'styled-components';

export const SLIDER_WIDTH = 570;
export const SLIDER_THUMB_WIDTH = 30;

export const RangeInputHolder = styled.div<{ $disabled?: boolean }>`
    position: relative;
    background: #ddd;
    height: 9px;
    border-radius: 5px;
    width: ${SLIDER_WIDTH}px;
    ${({ $disabled }) =>
        $disabled &&
        css`
            cursor: wait;
        `}
`;

export const InputVal = styled(m.div)`
    border-bottom-left-radius: 20px;
    border-top-left-radius: 20px;
    position: absolute;
    left: 0;
    z-index: 0;
    height: 9px;
    max-width: ${SLIDER_WIDTH}px;
    top: 0;
    pointer-events: none;
    background: #813bf5;
`;
export const RangeInput = styled.input<{ $thumbLeft?: number }>`
    appearance: none;
    -webkit-appearance: none;
    width: ${SLIDER_WIDTH}px;
    height: 9px;
    top: 0;
    left: 0;
    position: relative;
    border-radius: 5px;
    outline: none;
    -webkit-transition: 0.2s;

    &::-webkit-slider-thumb {
        appearance: none;
        -webkit-appearance: none;
        width: ${SLIDER_THUMB_WIDTH}px;
        height: ${SLIDER_THUMB_WIDTH}px;
        z-index: 5;
        border-radius: 50%;
        border: 2px solid #813bf5;
        background-color: #fff;
        cursor: pointer;
        position: absolute;
        left: calc(${({ $thumbLeft = 0 }) => `${$thumbLeft}% - ${SLIDER_THUMB_WIDTH / 2}px`});
        bottom: -50%;
        transition: border 0.2s;
    }

    &:disabled {
        pointer-events: none;

        &::-webkit-slider-thumb {
            pointer-events: none;
            border: 2px solid rgba(129, 59, 245, 0.47);
        }
    }
`;

export const RangeLabel = styled.label`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    padding-bottom: 10px;
`;

export const InputDescription = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    font-family: Poppins, sans-serif;
    color: #6c6d8a;
    padding-bottom: 10px;
    span {
        font-weight: bold;
    }
`;

export const RangeInputWrapper = styled.div`
    display: grid;
    width: 100%;
    grid-template-columns: 1fr auto 2fr;
    align-items: center;
    font-size: 14px;
    gap: 10px;
`;

export const RangeLimits = styled.div`
    font-size: 18px;
    font-weight: 500;
    text-align: center;
`;

export const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
`;

export const RangeValueHolder = styled.div`
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
    top: -${SLIDER_THUMB_WIDTH}px;
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

export const PerformanceMarker = styled.div<{ $red?: boolean }>`
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    z-index: 3;
    top: 50%;
    transform: translateY(-50%);
    background: #62cc32;
    ${({ $red }) =>
        $red &&
        css`
            background: #ff0000;
        `}
`;

export const WarningContainer = styled.div<{ $visible: boolean }>`
    overflow: hidden;
    padding: 0 15px;
    font-size: 12px;
    font-family: Poppins, sans-serif;
    color: #ff0000;
    border: 1px solid #ff0000;
    border-radius: 5px;
    background: rgba(255, 0, 0, 0.1);
    height: 0;
    opacity: 0;
    transition: all 0.3s ease-in-out;
    ${({ $visible }) =>
        $visible &&
        css`
            opacity: 0.7;
            padding: 8px 15px;
            max-height: 50px;
            height: auto;
        `}
`;
