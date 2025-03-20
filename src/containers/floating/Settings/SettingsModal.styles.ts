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

export const EndContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

export const ContentContainer = styled.div`
    width: 100%;
    max-width: min(450px, max-content);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    position: relative;
`;

export const SectionWrapper = styled.div`
    max-width: 100%;
    display: flex;
    flex-direction: column;
    padding: 0 30px 20px;
`;
