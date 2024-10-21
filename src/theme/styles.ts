import styled from 'styled-components';
import { m } from 'framer-motion';

import { viewType } from '@app/store/types.ts';

export const sidebarWidth = '348px'; // if this is updated please update the value in init-visuals.js

export const DashboardContainer = styled(m.div)<{ $view?: viewType }>`
    display: grid;
    grid-template-columns: ${sidebarWidth} auto;
    position: relative;
    gap: 20px;
    padding: 20px;
    height: 100%;
    background-color: ${(props) => (props.$view !== 'setup' ? 'none' : props.theme.palette.background.splash)};
`;
