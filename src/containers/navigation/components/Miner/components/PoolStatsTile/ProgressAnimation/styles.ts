import styled, { css } from 'styled-components';
import * as m from 'motion/react-m';

export const Wrapper = styled(m.div)`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 10px;
    z-index: 1;
    padding-right: 20px;

    background: linear-gradient(0deg, #eafadf 0%, #eafadf 100%), #fff;

    ${({ theme }) =>
        theme.mode === 'dark' &&
        css`
            background: linear-gradient(0deg, #1a2d28 0%, #1a2d28 100%), #1a2d28;
        `}

    .lottie-animation {
        width: 100%;
        height: 100%;
        transform: scale(1.1);
    }
`;
