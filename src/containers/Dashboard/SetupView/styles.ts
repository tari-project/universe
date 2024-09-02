import { keyframes, styled } from '@mui/material/styles';

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
