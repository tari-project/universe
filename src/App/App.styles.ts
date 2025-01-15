import { m } from 'framer-motion';
import styled from 'styled-components';

const variants = {
    hidden: {
        opacity: 0,
        scale: 1,
        transition: {
            duration: 0.5,
        },
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
        },
    },
    exit: {
        opacity: 0,
        scale: 1.5,
        transition: {
            duration: 0.8,
            ease: [0.43, 0.13, 0.23, 0.96],
        },
    },
};

export const AppContentContainer = styled(m.div).attrs({
    variants,
    animate: 'visible',
    exit: 'exit',
})`
    width: 100vw;
    height: 100vh;
`;
