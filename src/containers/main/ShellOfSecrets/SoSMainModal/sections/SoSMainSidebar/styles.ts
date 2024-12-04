import styled from 'styled-components';

export const Wrapper = styled('div')`
    max-width: 532px;
    width: 100%;
    height: 100%;

    background: rgba(230, 255, 71, 0.1);
    backdrop-filter: blur(1px);

    padding: 32px 26px;
`;

export const BGImage1 = styled('img')``;

export const BGImage2 = styled('img')``;

export const ContentLayer = styled('div')`
    position: relative;
    z-index: 1;

    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: column;
    gap: 20px;

    justify-content: space-between;
`;
