import { m } from 'framer-motion';
import styled from 'styled-components';

export const Canvas = styled('canvas')`
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
    width: 100%;
    height: 100%;
`;

export const Vignette = styled.div`
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    background: radial-gradient(circle at center, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 100%);
    mix-blend-mode: multiply;
`;
