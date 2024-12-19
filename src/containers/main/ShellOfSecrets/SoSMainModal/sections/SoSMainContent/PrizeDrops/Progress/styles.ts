import styled from 'styled-components';

export const Wrapper = styled('div')`
    height: 18px;

    display: flex;
    border-radius: 4px;
    background-color: #e6ff47;
    padding: 2px;
    position: relative;
`;

export const Bar = styled('div')`
    height: 100%;
    background-color: #0a1200;
    border-radius: 4px;
    transition: width 0.5s ease;
`;

export const Inside = styled('div')`
    position: relative;
    width: 100%;
`;

export const PercentWrapper = styled('div')`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const PercentClip = styled('div')<{ $percent: number }>`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    clip-path: ${({ $percent }) => `inset(0 ${100 - $percent}% 0 0)`};
    transition: clip-path 0.5s ease;
`;

export const PercentText = styled('div')`
    color: #000;
    font-family: 'Poppins', sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
    line-height: 100%;
    letter-spacing: 0.222px;
`;

export const PercentTextOverlap = styled(PercentText)`
    color: #fff;
`;
