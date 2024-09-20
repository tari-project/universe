import loading from '@app/assets/backgrounds/white-bg.jpg';
import styled from 'styled-components';
import { m } from 'framer-motion';

export const SplashScreenWrapper = styled(m.div)`
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    height: 100vh;
    width: 100vw;
`;
export const SplashScreenContainer = styled.div`
    position: absolute;
    background: url(${loading}) no-repeat center center fixed;
    background-size: cover;
    width: 100%;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const LottieContainer = styled.div`
    width: 600px;
    height: auto;
`;
