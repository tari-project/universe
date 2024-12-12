import styled from 'styled-components';

export const Canvas = styled('canvas')`
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
    width: 100%;
    height: 100%;
`;

export const Vignette = styled.div`
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
    background: radial-gradient(circle, rgba(0, 0, 0, 0.3) 0%, rgba(18, 18, 19, 0.8) 100%);
    mix-blend-mode: multiply;
`;
