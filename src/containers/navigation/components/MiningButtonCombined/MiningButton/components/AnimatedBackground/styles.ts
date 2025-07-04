import * as m from 'motion/react-m';
import styled, { keyframes } from 'styled-components';

const rotate = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`;

const cubeRotate = keyframes`
    from {
        transform: translateX(-50%) translateY(-50%) rotate(0deg);
    }
    to {
        transform: translateX(-50%) translateY(-50%) rotate(360deg);
    }
`;

export const Wrapper = styled(m.div)`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    border-radius: 500px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const Rings = styled.div`
    position: absolute;
    top: 50%;
    left: 72px;
    transform: translateY(-50%);
`;

export const Ring = styled(m.div)<{ $size: number }>`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 0;
    border-radius: 500px;
    border: 1px solid rgba(255, 255, 255, 0.1);

    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
`;

export const CubePath = styled.div<{ $size: number }>`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: 500px;
`;

export const AnimatedCubeWrapper = styled.div<{ $duration: number; $delay: number }>`
    width: 100%;
    height: 100%;
    animation: ${rotate} ${({ $duration }) => $duration}s linear infinite;
    animation-delay: ${({ $delay }) => $delay}s;
    border-radius: 500px;
    position: relative;
`;

export const CubeStartPosition = styled.div<{ $startAngle: number }>`
    width: 100%;
    height: 100%;
    position: absolute;
    transform: rotate(${({ $startAngle }) => $startAngle}deg);
`;

export const IndividualCubeWrapper = styled.div<{ $rotationDuration: number }>`
    position: absolute;
    top: 0;
    left: 50%;
    animation: ${cubeRotate} ${({ $rotationDuration }) => $rotationDuration}s linear infinite;
`;
