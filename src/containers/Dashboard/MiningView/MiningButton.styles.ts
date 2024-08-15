import { styled } from '@mui/material/styles';
import { Button } from '@mui/material';
import { AiOutlineLoading } from 'react-icons/ai';
import { keyframes } from '@emotion/react';

export const spin = keyframes`
  from {
  transform:rotate(0deg)
  }
  to {
  transform:rotate(360deg)
  }
`;
export const StyledIcon = styled(AiOutlineLoading)(() => ({
    animation: `${spin} 1s infinite`,
    animationTimingFunction: 'cubic-bezier(0.76, 0.89, 0.95, 0.85)',
}));

export const StyledButton = styled(Button, {
    shouldForwardProp: (prop) => prop != 'hasStarted',
})<{ hasStarted: boolean }>(({ hasStarted }) => ({
    padding: '10px 18px',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    background: hasStarted ? '#000' : '#06C983',
    border: '1px solid',
    borderColor: hasStarted ? '#000' : '#06C983',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
        background: hasStarted ? 'rgba(0,0,0,0.9)' : 'rgba(6,201,131,0.9)',
        borderColor: hasStarted ? 'rgba(0,0,0,0.9)' : 'rgba(6,201,131,0.9)',
        transform: 'scale(1.01)',
    },
    '&:disabled': {
        borderColor: 'rgba(0,0,0,0.3)',
        background: 'rgba(0,0,0,0.01)',
    },
}));
