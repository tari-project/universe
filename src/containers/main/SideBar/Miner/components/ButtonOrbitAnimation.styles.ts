import styled from 'styled-components';
import { m } from 'framer-motion';

export const OrbitWrapper = styled(m.div)`
    position: absolute;
    width: 300px;
    height: 300px;
    max-width: 300px;
    max-height: 300px;
    pointer-events: none;
    user-select: none;
    z-index: 1;
`;
export const Orbit = styled(m.div)`
    border-radius: 100%;
    border-width: 1px;
    border-color: rgba(255, 255, 255, 0.13);
    color: rgba(255, 255, 255, 0.09);
    position: absolute;
    width: 100%;
    height: 100%;
`;

export const CubeWrapper = styled(m.div)`
    position: absolute;
    height: 22px;
    width: 22px;
    svg {
        width: 22px;
        height: 22px;
        position: relative;
    }
`;
