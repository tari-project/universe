import styled from 'styled-components';
import { SB_WIDTH } from '@app/theme/styles.ts';

export const ContentWrapper = styled.div`
    display: grid;
    height: 100%;
    grid-template-columns: ${SB_WIDTH}px;
    grid-template-rows: 1fr 90px;
    grid-template-areas:
        'tab-content'
        'balance';
    padding: 0 0 20px 0;
`;
export const TabContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 20px 0;
    gap: 8px;
    width: 100%;
    max-height: 100%;
`;

export const TabWrapper = styled.div`
    grid-area: tab-content;
    width: ${SB_WIDTH}px;
    height: 100%;
    overflow: hidden;
`;
export const WalletBalanceWrapper = styled.div`
    padding: 0 10px;
    flex-shrink: 0;
    display: flex;
    grid-area: balance;
`;

export const HistoryWrapper = styled.div`
    overflow: hidden;
    border-radius: 10px;
    height: calc(100vh - 235px);
`;
