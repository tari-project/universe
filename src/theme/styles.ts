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

export const Row = styled(motion.div)`
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    box-sizing: border-box;
    position: relative;
    width: 100%;
    height: 100%;
    &:after {
        content: '---';
        position: absolute;
        color: rgba(115, 28, 115, 0.89);
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
`;
export const Col = styled(motion.div)`
    display: grid;
    width: 100%;
    height: 100%;
    position: relative;
    &:after {
        content: '|';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: rgba(16, 166, 199, 0.75);
    }
`;
export const Guide = styled(motion.div)`
    position: absolute;
    width: 100%;
    height: 100%;
    bottom: 0;
    display: grid;
    grid-auto-flow: row;
`;
