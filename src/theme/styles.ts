import styled from 'styled-components';
import { motion } from 'framer-motion';

export const sidebarWidth = '348px'; // if this is updated please update the value in init-visuals.js

export const ContainerInner = styled(motion.div)`
    display: flex;
    flex-direction: row;
    gap: 20px;
    height: 100%;
`;

export const DashboardContainer = styled(motion.div)`
    display: flex;
    flex-direction: column;
    position: relative;
    gap: 20px;
    padding: 20px;
    height: 100%;
`;
