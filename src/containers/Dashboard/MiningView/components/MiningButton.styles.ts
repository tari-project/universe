import { ImSpinner3 } from 'react-icons/im';
import styled, { keyframes } from 'styled-components';
import { Button } from '@app/components/elements/Button.tsx';
import { m } from 'framer-motion';
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

export const ButtonWrapper = styled(m.div)`
    position: relative;
    display: flex;
    align-items: center;
    overflow: hidden;
    justify-content: center;
    border-radius: ${({ theme }) => theme.shape.borderRadius.button};
    width: 100%;
`;

export const StyledButton = styled(Button)<{ $hasStarted: boolean }>`
    width: 100%;
    position: relative;
    cursor: pointer;
    overflow: hidden;
    background: ${({ $hasStarted }) =>
        $hasStarted
            ? 'linear-gradient(90deg, #929292 0%, rgba(0,0,0,0.7) 99.49%)'
            : 'linear-gradient(90deg, #046937 0%, #188750 92.49%)'};
    color: ${({ theme }) => theme.palette.base};
    box-shadow: 0 0 3px 0 rgba(255, 255, 255, 0.58) inset;
    transition: opacity 0.4s ease-in-out background 0.4s ease-in-out;
    &:hover {
        background: ${({ $hasStarted }) =>
            $hasStarted
                ? 'linear-gradient(90deg, #929292 0%, rgba(0,0,0,0.65) 99.49%)'
                : 'linear-gradient(90deg, #046937 0%, rgba(17, 110, 64, 0.96) 92.49%)'};
    }

    &:disabled {
        opacity: 0.45;
        cursor: wait;
        &:hover {
            background: ${({ $hasStarted }) =>
                $hasStarted
                    ? 'linear-gradient(90deg, #929292 0%, rgba(0,0,0,0.7) 99.49%)'
                    : 'linear-gradient(90deg, #046937 0%, #188750 92.49%)'};
        }
    }
`;
