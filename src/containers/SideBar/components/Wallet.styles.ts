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
    justify-content: center;
    align-items: flex-start;
    padding: 10px;
    width: 100%;
    color: ${({ theme }) => theme.palette.text.secondary};
`;
