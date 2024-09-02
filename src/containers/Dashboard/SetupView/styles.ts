import { keyframes, styled } from '@mui/material/styles';

export const Wrapper = styled('div')`
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
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

export const FloatingImage = styled('img')`
    max-width: 260px;
    height: auto;
    animation: ${float} 3s ease-in-out infinite;
`;
