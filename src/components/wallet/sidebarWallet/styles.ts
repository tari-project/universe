import styled, { keyframes } from 'styled-components';
import * as m from 'motion/react-m';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { convertHexToRGBA } from '@app/utils';

export const WalletWrapper = styled(m.div)``;
export const Wrapper = styled.div`
    border-radius: 20px;
    background: ${({ theme }) => (theme.mode === 'dark' ? '#2E2E2E' : '#E9E9E9')};
    padding: 15px 11px 11px 11px;
    display: flex;
    position: relative;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
    height: 455px;
    gap: 10px;
`;

export const NavWrapper = styled.div`
    display: flex;
    flex-flow: row;
    align-items: center;
    width: 100%;
    gap: 10px;
`;

export const NavButton = styled(Button).attrs({
    size: 'medium',
})<{ $isActive?: boolean }>`
    line-height: 1.05;
    width: 100%;
    color: ${({ theme }) => theme.palette.text.primary};
    background-color: ${({ theme }) => theme.palette.base};
    text-transform: capitalize;
    &:hover {
        opacity: 0.85;
    }

    &:disabled {
        opacity: 0.2;
        pointer-events: none;
    }
`;
export const DetailsCard = styled(m.div)`
    display: flex;
    border-radius: 20px;
    padding: 14px;
    width: 100%;
    min-height: 95px;
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
    width: 400px;
    height: 500px;
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
`;
export const SwapsWrapper = styled(m.div)``;
export const SyncButton = styled.button`
    color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.5)};
    font-family: Poppins, sans-serif;
    font-size: 11px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.44px;

    display: flex;
    align-items: center;
    gap: 6px;

    background: transparent;
    border: none;
    cursor: pointer;

    transition: color 0.2s ease-in-out;

    svg {
        stroke: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.5)};
        transition: stroke 0.2s ease-in-out;
    }

    &:hover {
        color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 1)};

        svg {
            stroke: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 1)};
        }
    }
`;
