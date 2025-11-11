import { SwapStatus } from '@app/hooks/swap/lib/types';
import styled from 'styled-components';
import { m } from 'motion/react';

export const StatusValue = styled.div<{ $status?: SwapStatus }>`
    font-weight: 500;
    font-size: 14px;
    line-height: 1.3;
    letter-spacing: -0.015rem;
    color: ${({ $status: status, theme }) => {
        switch (status) {
            case 'processingapproval':
            case 'processingswap':
                return '#FF7700';
            case 'success':
                return theme.mode === 'dark' ? '#00ff00' : '#36C475';
            case 'error':
                return '#ff0000';
            default:
                return '#000000';
        }
    }};
`;

export const ProcessingDetailsWrapper = styled.div`
    padding: 20px;
`;

export const OfficialContractAddressConainer = styled.div`
    background: ${({ theme }) => theme.palette.background.paper};
    padding: 15px;
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

export const OfficialContractAddressWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    .label {
        font-size: 12px;
        color: ${({ theme }) => theme.palette.text.secondary};
    }
    .address {
        font-size: 14px;
        font-weight: 500;
        color: ${({ theme }) => theme.palette.text.primary};
    }
`;

export const CopyIconWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: visible;
    transition: all 0.2s ease-in-out;
    &:hover {
        scale: 1.1;
    }
`;

export const CopyText = styled(m.div)`
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    line-height: 26px;
    border-radius: 15px;
    background: #36c475;
    color: white;
    padding: 0 10px;
    z-index: 1;
`;

export const HelperText = styled.div`
    background: #e6fff6;
    border: 1px solid #06c983;
    padding: 15px;
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    font-size: 12px;

    color: #126537;
    .strong {
        font-weight: bold;
    }
    .btn {
        cursor: pointer;
        text-decoration: underline;
        font-weight: bold;
    }
`;
