import { m } from 'framer-motion';
import styled from 'styled-components';

export const Wrapper = styled(m.div)`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    display: flex;
    background-color: #000;
    z-index: 1;
    border-radius: 10px;
    overflow: hidden;
`;
