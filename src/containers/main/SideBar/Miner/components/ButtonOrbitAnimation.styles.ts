import styled from 'styled-components';
import { m } from 'motion/react';

export const OrbitWrapper = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300px;
    height: 300px;
    max-width: 300px;
    max-height: 300px;
    pointer-events: none;
    user-select: none;
    z-index: 0;
`;
export const Orbit = styled(m.div)`
    border-radius: 100%;
    border-width: 1px;
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.1);
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
