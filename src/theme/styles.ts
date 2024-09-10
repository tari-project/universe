import styled from 'styled-components';
import { motion } from 'framer-motion';
import clouds from '@app/assets/backgrounds/clouds.png';

export const sidebarWidth = '348px'; // if this is updated please update the value in init-visuals.js

export const DashboardContainer = styled(motion.div)`
    display: grid;
    grid-template-columns: ${sidebarWidth} auto;
    position: relative;
    gap: 20px;
    padding: 20px;
    height: 100%;
`;

export const BackgroundImage = styled(motion.div)`
    background-color: ${(props) => props.theme.palette.background.default};
    background-size: cover;
    pointer-events: none;
    background-image: url(${clouds});
    background-position: center;
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
`;
