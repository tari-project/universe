import styled from 'styled-components';

export const ShuttingDownScreenContainer = styled.div`
    position: absolute;
    background-color: ${({ theme }) => theme.palette.background.accent};
    background-size: cover;
    z-index: 100;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;
