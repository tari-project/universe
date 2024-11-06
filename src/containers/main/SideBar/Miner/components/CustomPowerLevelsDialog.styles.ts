import styled, { css } from 'styled-components';

export const SLIDER_WIDTH = 570;
export const SLIDER_THUMB_WIDTH = 30;

export const CustomLevelsContent = styled.div`
    padding: 15px 15px 35px;
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 30px;
    width: 700px;
`;

export const RangeInput = styled.input`
    position: relative;
    z-index: 2;
    margin: 5px 0;
    -webkit-appearance: none;
    width: 100%;
    height: 9px;
    border-radius: 5px;
    background: #ddd;
    outline: none;
    -webkit-transition: 0.2s;
    transition: opacity 0.2s;
    width: ${SLIDER_WIDTH}px;

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: ${SLIDER_THUMB_WIDTH}px;
        height: ${SLIDER_THUMB_WIDTH}px;
        border-radius: 50%;
        background: white;
        border: 2px solid #813bf5;
        z-index: 10;
        cursor: pointer;
        transition: background 0.15s ease-in-out;
    }
`;

export const CustomLelvelsHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-size: 18px;
    font-family: Poppins, sans-serif;
    padding-bottom: 26px;
    border-bottom: 1px solid #0000000d;
`;

export const RangeLabel = styled.label`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-family: Poppins, sans-serif;
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

export const RangeIntputWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-family: Poppins, sans-serif;
    gap: 10px;
`;

export const RangeInputHolder = styled.div`
    position: relative;
`;

export const RangeLimits = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-family: Poppins, sans-serif;
`;

export const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
`;

export const RangeValueHolder = styled.div`
    display: flex;
    color: #fff;
    justify-content: center;
    align-items: center;
    transform: translateX(-50%) translateZ(0);
    background: #813bf5;
    position: absolute;
    min-width: 20px;
    padding: 2px 8px;
    border-radius: 5px;
    min-height: 20px;
    top: -35px;
    z-index: 2;
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
    transform: translateX(-50%);
    width: 5px;
    height: 5px;
    border-radius: 50%;

    z-index: 3;

    top: 8px;

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
    font-size: 12px;
    height: 0;
    opacity: 0;
    transition: all 0.3s ease-in-out;
    ${({ $visible }) =>
        $visible &&
        css`
            opacity: 0.7;
            padding: 8px 15px;
            height: 50px;
        `}
`;

export const SuccessContainer = styled.div<{ $visible: boolean }>`
    overflow: hidden;
    padding: 15px;
    font-size: 12px;
    font-family: Poppins, sans-serif;
    color: #188750;
    border: 1px solid #188750;
    border-radius: 5px;
    background: rgba(24, 135, 80, 0.1);
    font-size: 12px;
    opacity: 0;
    transition: all 0.3s ease-in-out;
    ${({ $visible }) =>
        $visible &&
        css`
            opacity: 1;
        `}
`;

export const TopRightContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
`;
