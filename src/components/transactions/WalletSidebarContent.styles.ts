import styled from 'styled-components';

export const ContentWrapper = styled.div`
    display: grid;
    height: 100%;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 80px;
    gap: 10px;
    grid-template-areas:
        'tab-content'
        'balance';
`;
export const TabContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex-flow: column;
    gap: 8px;
    width: 100%;
    height: 100%;
`;

export const TabWrapper = styled.div`
    grid-area: tab-content;
    width: 100%;
    height: 100%;
    overflow: hidden;
`;
export const WalletBalanceWrapper = styled.div`
    flex-shrink: 0;
    display: flex;
    grid-area: balance;
`;

export const HistoryWrapper = styled.div`
    overflow: hidden;
    border-radius: 10px;
    max-height: calc(100vh - 220px);
    height: 100%;
`;
