import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    align-self: end;
    grid-area: footer;
    z-index: 2;
    justify-content: space-between;
    align-items: flex-end;
    height: 100px;
`;

export const StatusWrapper = styled.div`
    display: flex;
    height: 100px;
    flex-direction: row;
    align-items: center;
    gap: 22px;
`;

export const LottieWrapper = styled.div`
    display: flex;
    max-height: 100%;
`;
