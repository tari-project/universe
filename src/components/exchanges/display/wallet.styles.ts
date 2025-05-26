import styled from 'styled-components';

export const WalletDisplayWrapper = styled.div`
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: 20px;
    padding: 15px 15px 0 15px;
    display: flex;
    flex-direction: column;
`;

export const XCInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
`;
export const HeaderSection = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;
