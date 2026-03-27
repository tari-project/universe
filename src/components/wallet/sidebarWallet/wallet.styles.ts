import styled, { css } from 'styled-components';
import * as m from 'motion/react-m';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export const WalletWrapper = styled(m.div)<{ $listHidden?: boolean; $isSwaps?: boolean }>`
    background: ${({ theme }) => (theme.mode === 'dark' ? '#2E2E2E' : '#E9E9E9')};
    flex-direction: column;
    border-radius: 20px;
    display: flex;
    padding: 10px;
    flex: 1 1 100%;

    ${({ $listHidden }) =>
        $listHidden &&
        css`
            flex: 0 1 0;
        `}

    ${({ $isSwaps }) =>
        $isSwaps &&
        css`
            position: absolute;
            height: auto;
            z-index: 5;
            bottom: 12px;
            width: calc(100% - 24px);
        `}
`;

export const TabsWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 40px;
    margin: 8px 0;
`;

export const CTAWrapper = styled.div`
    margin: 8px 0 0 0;
`;

export const BuyButton = styled(Button)`
    background-color: #000;
    color: #fff;
    transition: opacity 0.1s ease-in-out;
    span {
        transition: transform 0.15s ease-in-out;
        transform-origin: center;
    }
    &:hover:not(:disabled) {
        background-color: #000;
        color: #fff;
        opacity: 0.9;
        span {
            transform: scale(1.025);
        }
    }
`;
