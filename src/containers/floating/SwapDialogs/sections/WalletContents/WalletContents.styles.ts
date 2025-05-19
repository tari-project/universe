import styled, { keyframes } from 'styled-components';

export const ConnectedWalletWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 15px 10px 12px;
    border-radius: 60px;
    background: ${({ theme }) => theme.palette.background.main};
`;

export const StatusWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
`;

const pulse = keyframes`
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
`;

export const ActiveDot = styled.div`
    width: 9px;
    height: 8px;
    border-radius: 100%;
    background: ${({ theme }) => theme.palette.success.main};
    animation: ${pulse} 2s infinite;
`;

export const WalletContentsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 5px;
`;

export const TokenList = styled.div`
    border-radius: 16px;
    padding: 8px 0;
    display: flex;
    flex-direction: column;
    box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.05);
    background: ${({ theme }) => theme.palette.background.main};
`;

export const TokenItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    transition: background-color 0.15s ease-in-out;
`;

export const TokenItemLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

export const TokenIconWrapper = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
`;

export const TokenInfo = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;

export const TokenName = styled.span`
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 16px;
    line-height: 1.3;
    color: ${({ theme }) => theme.palette.text.primary};
`;

export const TokenSymbol = styled.span`
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    font-size: 13px;
    color: ${({ theme }) => theme.palette.text.secondary};
    line-height: 1.3;
    text-transform: uppercase;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const TokenItemRight = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
`;

export const TokenSeparator = styled.hr`
    border: none;
    height: 1px;
    background-color: ${({ theme }) => theme.palette.divider};
    margin: 0 20px;
`;

export const WalletAddress = styled.div`
    color: black;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 80%;
    color: ${({ theme }) => theme.palette.text.primary};
`;
