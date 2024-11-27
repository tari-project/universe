import { m } from 'framer-motion';
import styled from 'styled-components';

export const AppContentWrapper = styled.div``;

const transition = {
    ease: 'easeIn',
    duration: 0.5,
    x: {
        duration: 0.4,
    },
};
const variants = {
    hidden: {
        x: -10,
        opacity: 0,
        transition,
    },
    visible: {
        y: 0,
        opacity: 1,
        transition,
    },
    exit: {
        x: -10,
        opacity: 0,
        transition: { duration: 0.2, ease: 'easeOut' },
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
