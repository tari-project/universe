import { m } from 'framer-motion';
import styled from 'styled-components';

export const Container = styled.div`
    width: 100%;
    display: flex;
    align-items: stretch;
    height: 60vh;
`;

export const HeaderContainer = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 20px 0;
    text-transform: capitalize;
`;

export const ContentContainer = styled.div`
    width: 100%;
    min-width: 600px;
    display: flex;
    flex-direction: column;
    padding: 30px;
`;

const transition = {
    ease: 'linear',
    duration: 0.25,
};

export const variants = {
    initial: {
        x: -15,
        opacity: 0,
        transition,
    },
    exit: {
        x: 20,
        opacity: 0,
        transition,
    },
    visible: {
        x: 0,
        opacity: 1,
        transition,
    },
};
export const SectionWrapper = styled(m.div).attrs({
    initial: 'initial',
    animate: 'visible',
    exit: 'exit',
})`
    max-width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`;
