import styled, { keyframes } from 'styled-components';

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

const float = keyframes`
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
`;

export const FloatingImage = styled.img`
    max-width: 260px;
    height: auto;
    animation: ${float} 3s ease-in-out infinite;
`;
