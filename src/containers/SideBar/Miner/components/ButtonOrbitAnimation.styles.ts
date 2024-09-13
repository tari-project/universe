import styled from 'styled-components';
import { motion } from 'framer-motion';

export const OrbitWrapper = styled(motion.div)`
    position: absolute;
    width: 300px;
    height: 300px;
    max-width: 300px;
    max-height: 300px;
    overflow: hidden;
    pointer-events: none;
    user-select: none;
    z-index: 1;
`;
export const Orbit = styled(motion.div)`
    border-radius: 100%;
    border-width: 1px;
    border-style: solid dashed dashed dashed;
    border-color: rgba(255, 255, 255, 0.175);
    color: rgba(255, 255, 255, 0.3);
    position: absolute;
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
