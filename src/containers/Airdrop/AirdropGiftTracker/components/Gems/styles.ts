import { m } from 'framer-motion';
import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0px;
    position: relative;
    z-index: 1;
`;

export const Number = styled('div')`
    display: flex;
    align-items: center;
    gap: 2px;

    color: #000;
    font-size: 18px;
    font-weight: 600;
`;

export const Label = styled('div')`
    color: #797979;
    font-size: 12px;
    font-weight: 500;
`;

export const GemImage = styled('img')`
    position: relative;
    z-index: 1;
`;

export const GemsAnimation = styled(m.div)`
    position: absolute;
    top: 1px;
    left: 1px;
    z-index: 0;
`;

export const GemAnimatedImage = styled(m.img)`
    position: absolute;
    top: 0;
    left: 0;
`;
