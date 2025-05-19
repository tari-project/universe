import styled from 'styled-components';
import { m } from 'motion/react';

export const ModalContent = styled(m.div)``;

export const TokenList = styled.div`
    max-height: 400px; /* Or adjust */
    overflow-y: auto;
    border-radius: 8px;
    padding: 8px;
    background-color: ${({ theme }) => theme.palette.background.main};
    border-radius: 25px;
`;

export const TokenItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 8px;
    cursor: pointer;
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
    transition: opacity 0.2s ease-in-out;
    &:last-child {
        border-bottom: none;
    }
    &:hover {
        opacity: 0.5;
    }
`;

export const TokenInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

export const TokenDetails = styled.div`
    display: flex;
    flex-direction: column;
    .name {
        font-weight: 500;
    }
    .symbol {
        font-size: 0.875rem;
        color: ${({ theme }) => theme.palette.text.secondary};
    }
`;

export const TokenValue = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    .usd {
        font-weight: 500;
    }
    .balance {
        font-size: 0.875rem;
        color: ${({ theme }) => theme.palette.text.secondary};
        border-radius: 100px;
        background: ${({ theme }) => theme.palette.background.secondary};
        padding: 2px 6px;
        margin-top: 4px;
    }
`;
