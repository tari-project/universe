import { styled } from 'styled-components';

export const WalletConnectHeader = styled.div`
    margin-bottom: 20px;
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 21px;
    line-height: 31px;
    color: black;
    padding-left: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const WalletAddress = styled.div`
    color: black;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 80%;
`;
