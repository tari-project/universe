import styled from 'styled-components';
import * as m from 'motion/react-m';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

export const ModalWrapper = styled(m.div)`
    position: relative;
    border-radius: 35px;
    background: #ffffffbf;
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    padding: 40px;
    max-width: 625px;
    overflow: hidden;
    gap: 20px;
`;

export const CloseButton = styled.button`
    position: absolute;
    top: 20px;
    right: 20px;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s ease;
    z-index: 10;

    &:hover {
        background: rgba(0, 0, 0, 0.1);
    }

    svg {
        width: 16px;
        height: 16px;
        opacity: 0.7;
    }
`;

export const ModalHeader = styled.div`
    display: flex;
`;

export const ModalTitle = styled(Typography)`
    font-size: clamp(36px, 2rem + 0.5vh, 42px);
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -1.9px;
    color: #1a1a1a;
`;

export const ModalBody = styled(Typography).attrs({ variant: 'p' })`
    font-size: 16px;
    color: #666666;
    line-height: 1.1;
`;

export const ClaimContainer = styled.div`
    width: 535px;
    border-radius: 15px;
    gap: 20px;
    padding: 30px;

    display: flex;
    flex-direction: column;
    justify-content: center;

    /* Multi-layered background as specified */
    background: linear-gradient(0deg, #ffffff, #ffffff), linear-gradient(262.12deg, #333909 2.2%, #091d07 100.01%);

    /* Alternative implementation if the above doesn't work */
    background-color: #091d07;
    background-image: linear-gradient(262.12deg, #333909 2.2%, #091d07 100.01%);

    /* Add subtle border for definition */
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const EyebrowText = styled.div`
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.48px;
`;

export const TrancheAmount = styled.div`
    font-size: 48px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;
    margin: 8px 0;
`;

export const RemainingBalance = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: #ffffff;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    border-radius: 10px;
    text-align: center;
    width: 100%;
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
    display: flex;
    justify-content: center;
    gap: 8px;
    margin: 8px 0;
`;

export const CountdownSquare = styled.div`
    width: 44px;
    height: 44px;
    background: #ffffff;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000000;
    font-size: 12px;
    font-weight: 600;
    font-family: monospace;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

export const CountdownWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
`;
