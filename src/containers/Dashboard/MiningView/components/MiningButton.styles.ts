import { ImSpinner3 } from 'react-icons/im';
import styled, { keyframes } from 'styled-components';
import { Button } from '@app/components/elements/Button.tsx';
import { motion } from 'framer-motion';
export const spin = keyframes`
  from {
  transform:rotate(0deg)
  }
  to {
  transform:rotate(360deg)
  }
`;
export const StyledIcon = styled(ImSpinner3)`
    animation: ${spin} 2s infinite;
    animation-timing-function: cubic-bezier(0.76, 0.89, 0.95, 0.85);
`;

export const IconWrapper = styled.div`
    width: 27px;
    height: 27px;
    border-radius: 100%;
    background-color: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    svg {
        height: 16px;
    }
`;

export const ButtonWrapper = styled(motion.div)`
    position: relative;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    width: 100%;
`;

export const StyledButton = styled(Button)<{ $hasStarted: boolean }>`
    display: flex;
    width: 100%;
    align-items: center;
    background: ${({ $hasStarted }) => ($hasStarted ? '#000' : '#188750')};
    border: 1px solid ${({ $hasStarted }) => ($hasStarted ? '#000' : '#188750')};
    color: ${({ theme }) => theme.palette.base};
    transition: all 0.2s ease-in;
    &:hover {
        background: ${({ $hasStarted }) => ($hasStarted ? 'rgba(0,0,0,0.9)' : 'rgba(17,110,64,0.96)')};
        border-color: ${({ $hasStarted }) => ($hasStarted ? 'rgba(0,0,0,0.9)' : 'rgba(28,150,88,0.9)')};
        transform: scale(1.01);
    }
    &:disabled {
        border-color: rgba(0, 0, 0, 0.3);
        background: ${({ $hasStarted }) => ($hasStarted ? '#000' : '#188750')};
    }
`;
