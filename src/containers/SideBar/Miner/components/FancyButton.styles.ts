import styled from 'styled-components';
import { Button } from '@app/components/elements/Button.tsx';
import { motion } from 'framer-motion';

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
    align-items: center;
    justify-content: center;
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

export const OrbitWrapper = styled(motion.div)`
    position: relative;
    background: rgba(187, 122, 134, 0.62);
    width: 300px;
    height: 300px;
`;
export const Orbit = styled(motion.div)`
    border-radius: 100%;
    border: 1px dashed rgba(255, 255, 255, 0.66);
    position: absolute;
    color: pink;
    width: 100%;
    height: 100%;
`;

export const CubeWrapper = styled(motion.div)`
    height: 24px;
    width: 24px;

    position: absolute;
    svg {
        width: 24px;
        height: 24px;
    }
`;
