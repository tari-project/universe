import { SwapStatus } from '@app/hooks/swap/lib/types';
import styled from 'styled-components';

export const StatusValue = styled.div<{ $status?: SwapStatus }>`
    font-family: Poppins;
    font-weight: bold;
    font-size: 14px;
    line-height: 117%;
    letter-spacing: -3%;
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
