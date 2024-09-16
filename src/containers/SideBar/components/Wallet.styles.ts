import { IconButton } from '@app/components/elements/Button';
import styled from 'styled-components';

export const WalletBalance = styled.div`
    display: flex;
    justify-content: flex-start;
    color: #fff;
    width: 100%;
`;

export const WalletBalanceContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 5px;
    width: 100%;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const BalanceVisibilityButton = styled(IconButton)`
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2) !important;
    height: 22px;
    width: 22px;
`;
