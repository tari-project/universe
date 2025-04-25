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

export const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 24px;
    padding: 24px;
    width: 100%;
`;

export const ConnectButton = styled.button`
    cursor: pointer;
    border-radius: 12px;
    display: flex;
    align-items: center;
    width: 100%;
    background: white;
    color: black;
    gap: 16px;
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 14px;
    line-height: 100%;
    padding: 10px 12px;
    img {
        width: 25px;
    }
    &:hover {
        background: #f5f5f5;
    }
`;

export const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: rgba(0, 0, 0, 0.1);
    margin-top: 20px;
`;

export const WalletAddress = styled.div`
    color: black;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 80%;
`;
