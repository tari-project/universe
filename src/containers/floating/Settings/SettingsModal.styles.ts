import styled from 'styled-components';

export const Container = styled.div`
    width: 75vw;
    height: 70vh;

    display: flex;
    position: relative;
    align-items: stretch;
    overflow: hidden;

    max-width: 1000px;

    @media (min-width: 1200px) {
        height: 80vh;
    }
`;

export const HeaderContainer = styled.div`
    width: 100%;
    background-color: ${({ theme }) => theme.palette.background.paper};
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30px;
    text-transform: capitalize;
    position: sticky;
    top: 0;
    z-index: 1;
`;

export const ContentContainer = styled.div`
    width: 100%;
    max-width: min(450px, max-content);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    position: relative;
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

export const SectionWrapper = styled.div`
    max-width: 100%;
    display: flex;
    flex-direction: column;
    padding: 0 30px 20px;
`;
