import { styled } from '@mui/material/styles';
import loading from '@app/assets/backgrounds/white-bg.jpg';

export const SplashScreenContainer = styled('div')`
    position: absolute;
    background: url(${loading}) no-repeat center center fixed;
    background-size: cover;
    z-index: 100;
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const LottieContainer = styled('div')`
    width: 600px;
    height: auto;
`;
