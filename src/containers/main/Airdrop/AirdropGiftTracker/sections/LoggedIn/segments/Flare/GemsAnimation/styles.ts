import { m } from 'motion/react';
import styled from 'styled-components';

export const Wrapper = styled(m.div)`
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 0;
`;

export const Canvas = styled('canvas')`
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 0;
`;
