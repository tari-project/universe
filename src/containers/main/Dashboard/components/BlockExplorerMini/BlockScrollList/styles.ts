import * as m from 'motion/react-m';
import styled from 'styled-components';

export const ScrollMask = styled.div`
    display: flex;
    align-items: center;
    position: relative;
    cursor: default;
    gap: 27px;
    overflow: hidden;

    padding-right: 16px;
    padding-left: 16px;
    width: 100%;

    mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 100px), transparent 100%);
    -webkit-mask-image: -webkit-linear-gradient(
        to right,
        transparent,
        black 0px,
        black calc(100% - 100px),
        transparent 100%
    );
`;

export const DragContainer = styled(m.div)`
    display: flex;
    gap: 8px;
    will-change: transform;
    padding-right: 600px;
    width: fit-content;
    user-select: none;
`;
