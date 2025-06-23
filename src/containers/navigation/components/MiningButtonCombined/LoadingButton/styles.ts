import * as m from 'motion/react-m';
import styled from 'styled-components';

export const LoadingWrapper = styled(m.div)`
    position: relative;
    border-radius: 500px;
    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    justify-content: center;

    background: #888;
    box-shadow:
        0px 0px 10px 0px rgba(136, 136, 136, 0.35),
        0px 0px 13px 0px rgba(255, 255, 255, 0.25) inset;

    pointer-events: none;
    color: #fff;
`;
