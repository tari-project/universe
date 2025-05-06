import styled from 'styled-components';

export const Wrapper = styled('div')`
    color: #e6ff47;
    font-family: 'IBM Plex Mono', sans-serif;
    font-style: normal;
    font-weight: 700;

    display: flex;
    align-items: center;
    position: relative;

    transform: translateY(-2px);
`;

export const VerticalText = styled('div')`
    text-align: center;
    font-size: 8px;
    line-height: 100%;
    text-transform: uppercase;
    transform: rotate(270deg) translateX(10px);
    transform-origin: 100% 100%;

    border-bottom: 1px solid #e6ff47;
    position: relative;

    flex-shrink: 0;
    align-self: flex-start;
    padding-bottom: 8px;
    width: 110px;

    position: absolute;
    top: -8px;
    left: -90px;
`;

export const DividerLineLeft = styled('div')`
    width: 1px;
    height: 9px;
    background-color: #e6ff47;

    position: absolute;
    top: 100%;
    left: 0;
`;

export const DividerLineRight = styled('div')`
    width: 1px;
    height: 9px;
    background-color: #e6ff47;

    position: absolute;
    top: 100%;
    right: 0;
`;

export const TimerColumn = styled('div')`
    display: flex;
    flex-direction: column;
    padding-left: 30px;
    gap: 4px;
`;

export const NumberGroup = styled('div')`
    display: flex;
    gap: 2px;
    align-items: flex-end;
`;

export const Number = styled('div')`
    font-size: 64px;
    line-height: 80%;
    text-transform: uppercase;
`;

export const Label = styled('div')`
    font-size: 16px;
    line-height: 100%;
    text-transform: uppercase;
`;
