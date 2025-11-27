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
    padding: 40px;
    width: clamp(620px, 63vw, 825px);
    overflow: hidden;
    gap: 20px;
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
    font-size: 16px;
    color: ${({ theme }) => theme.palette.text.primary};
    opacity: 0.8;
    line-height: 1.1;
    font-weight: 400;
    letter-spacing: -0.45px;
`;

export const ClaimContainer = styled.div`
    margin-top: 8px;
    width: 100%;
    border-radius: 15px;
    gap: 20px;
    padding: 30px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    backdrop-filter: blur(20px);
    background: linear-gradient(262deg, #333909 2.2%, #091d07 100.01%), #333909;

    box-shadow: 0 1px 18px 1px rgba(0, 0, 0, 0.2);
`;

export const EyebrowText = styled.div`
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.48px;
`;

export const TrancheAmount = styled.div`
    color: #ffffff;
    line-height: 1;
    font-size: clamp(38px, 0.6rem + 2.5vw, 52px);
    font-weight: 600;
    letter-spacing: -1.56px;
    overflow-wrap: anywhere;
    span {
        color: rgba(255, 255, 255, 0.5);
        font-size: 28px;
        font-style: normal;
        font-weight: 600;
        letter-spacing: -0.84px;
    }
`;

export const ClaimItems = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 8px;
`;
export const RemainingBalance = styled.div`
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    border-radius: 10px;
    text-align: center;
    width: 100%;

    color: rgba(255, 255, 255, 0.5);
    font-size: 16px;
    font-weight: 400;
    line-height: 1.3;
    letter-spacing: -0.48px;

    span {
        font-weight: 600;
        color: #ffffff;
    }
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

/* Countdown Components */
export const CountdownContainer = styled.div`
    display: grid;
    justify-content: center;
    min-width: min-content;
    gap: 8px;
    grid-template-columns: repeat(auto-fit, minmax(30px, 1fr));
    grid-auto-flow: column;
    padding: 0 4px;
`;

export const CountdownSquare = styled.div`
    line-height: 1;
    background: rgba(255, 255, 255, 0.85);
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000000;
    font-size: 12px;
    font-weight: 600;
    font-family: monospace;
    padding: 8px 3px;
    box-shadow: 0 0 7px 0 rgba(0, 0, 0, 0.13);
`;

export const CountdownWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
`;
