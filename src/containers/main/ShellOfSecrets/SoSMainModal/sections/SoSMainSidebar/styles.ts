import styled from 'styled-components';
import bgImage1 from './images/sidebar_bg_1.png';
import bgImage2 from './images/sidebar_bg_2.png';

export const Wrapper = styled('div')`
    width: 100%;

    background: rgba(230, 255, 71, 0.1);
    backdrop-filter: blur(1px);

    padding: 32px 26px;
    position: relative;

    overflow: hidden;
    overflow-y: auto;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        z-index: 0;
        background-image: url(${bgImage1});
        background-repeat: no-repeat;
        background-position: top right;
        width: 100%;
        height: 100%;
    }

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        z-index: 0;
        background-image: url(${bgImage2});
        background-repeat: no-repeat;
        background-position: bottom center;
        width: 100%;
        height: 100%;
    }
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
