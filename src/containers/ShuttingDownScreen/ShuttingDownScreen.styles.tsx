import loading from '@app/assets/backgrounds/white-bg.jpg';
import styled from 'styled-components';

export const ShuttingDownScreenContainer = styled.div`
    position: absolute;
    background: url(${loading}) no-repeat center center fixed;
    background-size: cover;
    z-index: 100;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;
