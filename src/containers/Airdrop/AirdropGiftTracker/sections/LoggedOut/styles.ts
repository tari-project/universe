import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

export const ClaimButton = styled('button')`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;

    height: 50px;
    padding: 12px 14px 12px 20px;

    border-radius: 60px;
    background: #000;

    transition: transform 0.2s ease;
    overflow: hidden;

    &:hover {
        transform: scale(1.05);
    }

    &:disabled {
        pointer-events: none;
    }
`;

export const Image = styled('img')``;

export const Title = styled('div')`
    color: #fff;
    text-align: center;
    font-size: 12px;
    font-weight: 600;

    position: relative;
    z-index: 2;
`;

export const GemPill = styled('div')`
    display: flex;
    height: 27px;
    padding: 8px 10px 8px 16px;
    justify-content: center;
    align-items: center;
    gap: 2px;

    border-radius: 100px;
    background: linear-gradient(0deg, #c9eb00 0%, #c9eb00 100%), linear-gradient(180deg, #755cff 0%, #2946d9 100%),
        linear-gradient(180deg, #ff84a4 0%, #d92958 100%);

    color: #000;
    text-align: center;
    font-size: 12px;
    font-weight: 600;

    position: relative;
    z-index: 2;
`;

export const ButtonCover = styled('div')`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1;
`;

export const VideoBG = styled('video')`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    pointer-events: none;
`;
