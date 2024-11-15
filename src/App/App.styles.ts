import { m } from 'framer-motion';
import styled from 'styled-components';

export const AppContentWrapper = styled.div``;

const transition = {
    ease: 'easeIn',
    duration: 0.6,
    y: {
        duration: 0.25,
    },
};
const variants = {
    hidden: {
        y: 20,
        opacity: 0,
        transition,
    },
    visible: {
        y: 0,
        opacity: 1,
        transition,
    },
    exit: {
        y: 0,
        opacity: 1,
        transition: { ...transition, duration: 0.3, ease: 'easeOut' },
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
