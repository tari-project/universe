import styled, { css } from 'styled-components';
import clouds from '@app/assets/backgrounds/clouds.png';

export const sidebarWidth = '348px'; // if this is updated please update the value in init-visuals.js

export const DashboardContainer = styled.div<{ $visualModeOff?: boolean }>`
    display: grid;
    grid-template-columns: ${sidebarWidth} auto;
    position: relative;
    gap: 20px;
    padding: 20px;
    height: 100%;

    &:after {
        content: '';
        position: absolute;
        background: ${({ theme }) =>
            `radial-gradient(140% 90% at 35% 20%, transparent 93%,  ${theme.palette.background.main} 98%)`};
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        z-index: 0;

        display: ${({ $visualModeOff }) => ($visualModeOff ? 'none' : 'flex')};
    }

    ${({ $visualModeOff, theme }) =>
        $visualModeOff &&
        css`
            &::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-size: cover;
                background-position: center;
                background-image: ${$visualModeOff ? `${theme.gradients.radialBg}, ` : ''}url(${clouds});
                background-blend-mode: overlay;
                filter: ${theme.mode === 'dark' ? 'brightness(0.45)' : 'none'};
            }
        `};
`;
