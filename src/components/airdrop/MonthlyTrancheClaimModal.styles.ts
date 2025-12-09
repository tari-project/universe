import styled from 'styled-components';
import * as m from 'motion/react-m';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

export const ModalWrapper = styled(m.div)`
    position: relative;
    border-radius: 35px;
    background: ${({ theme }) => (theme.mode === 'light' ? `rgba(255, 255, 255, 0.8)` : `rgba(30, 30, 30, 0.52)`)};
    backdrop-filter: blur(80px);
    display: flex;
    flex-direction: column;
    padding: 45px;
    width: 625px;
    overflow: hidden;
    gap: 26px;
`;

export const ModalHeader = styled.div`
    display: flex;
`;

export const ModalTitle = styled(Typography)`
    font-size: clamp(36px, 2rem + 0.5vh, 42px);
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -1.9px;
`;

export const ModalBody = styled(Typography).attrs({ variant: 'p' })`
    font-size: 18px;
    color: ${({ theme }) => theme.palette.text.primary};
    opacity: 0.75;
    display: flex;
    line-height: 1.2;
    font-weight: 400;
    letter-spacing: -0.28px;
`;

export const ClaimButton = styled(Button).attrs({
    size: 'xxl',
    fluid: true,
})<{ $isLoading?: boolean }>`
    background: #000000;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 21px;
    font-weight: 600;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background: #1a1a1a;
        transform: translateY(-1px);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    ${({ $isLoading }) =>
        $isLoading &&
        `
        background: #333333;
        cursor: wait;
    `}
`;

export const ClaimWrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: -45px;
`;

export const CoinWrapper = styled.iframe`
    border: none;
    min-height: 320px;
`;
