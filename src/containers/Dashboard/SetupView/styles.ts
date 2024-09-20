import styled from 'styled-components';

export const Wrapper = styled('div')`
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;

    @media (max-height: 794px) {
        justify-content: flex-start;
        padding-top: 50px;
    }

    @media (max-height: 672px) {
        justify-content: center;
        padding-top: 0;
    }
`;

export const SoonWrapper = styled.div`
    max-width: 260px;
    height: auto;
`;
