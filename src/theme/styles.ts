import styled, { css } from 'styled-components';
import { m } from 'framer-motion';
import clouds from '@app/assets/backgrounds/clouds.png';
import { viewType } from '@app/store/types.ts';

export const sidebarWidth = '348px'; // if this is updated please update the value in init-visuals.js

export const DashboardContainer = styled(m.div)<{ $view?: viewType; $visualModeOff?: boolean }>`
    display: grid;
    grid-template-columns: ${sidebarWidth} auto;
    position: relative;
    gap: 20px;
    padding: 20px;
    height: 100%;
    background-color: ${(props) => (props.$view !== 'setup' ? 'none' : props.theme.palette.background.splash)};

    ${({ $visualModeOff, $view, theme }) =>
        (($view === 'setup' && theme.mode !== 'dark') || $visualModeOff) &&
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
