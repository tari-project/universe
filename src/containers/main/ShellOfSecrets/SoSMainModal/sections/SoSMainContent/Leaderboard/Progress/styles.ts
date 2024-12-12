import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 10px;
`;

export const TopLabel = styled('div')`
    display: flex;
    align-items: center;
    gap: 40px;
    width: calc(100% + 10px);
    position: relative;
    transform: translateX(-5px);
`;

export const Line = styled('div')`
    width: 100%;
    height: 2px;
    background-color: #e6ff47;
`;

export const Text = styled('div')`
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    font-style: normal;
    font-weight: 700;
    line-height: 129.623%;
    text-transform: uppercase;
    white-space: nowrap;

    span {
        color: #e6ff47;
    }
`;

export const CapLeft = styled('div')`
    width: 2px;
    height: 8px;
    background-color: #e6ff47;

    position: absolute;
    top: 7px;
    right: 100%;
`;

export const CapRight = styled('div')`
    width: 2px;
    height: 8px;
    background-color: #e6ff47;

    position: absolute;
    top: 7px;
    left: 100%;
`;

export const ProgressBar = styled('div')`
    height: 41px;

    display: flex;
    border-radius: 4px;
    background-color: #e6ff47;
    padding: 4px;
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
    font-size: 20px;
    font-weight: 600;
    line-height: 100%;
    letter-spacing: 0.407px;
`;

export const PercentTextOverlap = styled(PercentText)`
    color: #fff;
`;
