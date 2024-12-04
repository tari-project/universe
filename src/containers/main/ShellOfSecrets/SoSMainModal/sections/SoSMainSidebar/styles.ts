import styled from 'styled-components';

export const Wrapper = styled('div')`
    max-width: 532px;
    width: 100%;
    height: 100%;

    background: rgba(230, 255, 71, 0.1);
    backdrop-filter: blur(1px);

    padding: 32px 26px;
    position: relative;
`;

export const BGImage1 = styled('img')`
    position: absolute;
    top: 0;
    right: 0;
    z-index: 0;
`;

export const BGImage2 = styled('img')`
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 0;
`;

export const ContentLayer = styled('div')`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 20px;

    position: relative;
    z-index: 1;

    width: 100%;
    height: 100%;
`;
