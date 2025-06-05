import styled, { keyframes } from 'styled-components';
import * as m from 'motion/react-m';

export const WalletWrapper = styled(m.div)``;
export const Wrapper = styled.div`
    border-radius: 20px;
    background: ${({ theme }) => (theme.mode === 'dark' ? '#2E2E2E' : '#E9E9E9')};
    padding: 15px 11px 11px 11px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-height: clamp(10vh, 600px, 55vh);
    gap: 10px;
`;

export const DetailsCard = styled(m.div)`
    display: flex;
    border-radius: 20px;
    padding: 14px;
    width: 100%;
    min-height: 170px;
    box-shadow: 10px 10px 40px 0 rgba(0, 0, 0, 0.06);
    position: relative;
    overflow: hidden;
`;

const spin = keyframes`
  100% {
    transform: translate(-50%, -50%)  rotate(-360deg);
  }
`;

export const AnimatedBG = styled.div<{ $col1: string; $col2: string }>`
    background-image: ${({ $col1, $col2 }) => `linear-gradient(15deg, ${$col1} 0%, ${$col2} 140%)`};
    position: absolute;
    top: 50%;
    left: 50%;
    width: 150%;
    height: 300%;
    transform: translate(-50%, -50%);
    animation: ${spin} 15s linear infinite;
    z-index: 0;
`;

export const DetailsCardContent = styled.div`
    z-index: 1;
    justify-content: space-between;
    flex-direction: column;
    display: flex;
    width: 100%;
    height: 100%;
`;
export const SwapsWrapper = styled(m.div)``;
