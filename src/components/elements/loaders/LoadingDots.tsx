import React from 'react';
import styled, { keyframes } from 'styled-components';

const spinnerAnimation = keyframes`
  93.75%, 100% {
    opacity: 0.2;
  }
`;

const Circle = styled.circle`
    animation: ${spinnerAnimation} 0.8s linear infinite;
    animation-delay: -0.8s;
`;

const SecondCircle = styled(Circle)`
    animation-delay: -0.65s;
`;

const ThirdCircle = styled(Circle)`
    animation-delay: -0.5s;
`;

const LoadingDots: React.FC = () => {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <Circle cx="4" cy="12" r="3" />
            <SecondCircle cx="12" cy="12" r="3" />
            <ThirdCircle cx="20" cy="12" r="3" />
        </svg>
    );
};

export default LoadingDots;
