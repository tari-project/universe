import styled from 'styled-components';
import { motion } from 'framer-motion';

export const OrbitWrapper = styled(motion.div)`
    position: absolute;
    width: 300px;
    height: 300px;
`;
export const Orbit = styled(motion.div)`
    border-radius: 100%;
    border: 1px dashed rgba(255, 255, 255, 0.15);
    position: absolute;
    color: rgba(255, 255, 255, 0.2);
    width: 100%;
    height: 100%;
`;

export const CubeWrapper = styled(motion.div)`
    position: absolute;
    height: 24px;
    width: 24px;

    svg {
        width: 24px;
        height: 24px;
        position: relative;
    }
`;
