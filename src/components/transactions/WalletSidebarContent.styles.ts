import styled from 'styled-components';

export const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 100%;
`;
export const TabContentWrapper = styled.div`
    display: flex;
    max-width: 100%;
    flex-direction: column;
    padding: 20px;
    align-items: center;
    gap: 8px;
`;
export const HistoryListWrapper = styled.div`
    height: calc(100vh - 280px);
    border-radius: 10px;
    overflow: hidden;
    width: 100%;
`;

export const WalletBalanceWrapper = styled.div`
    padding: 0 20px;
`;
