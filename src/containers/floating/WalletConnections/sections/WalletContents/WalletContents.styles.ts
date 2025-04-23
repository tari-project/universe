import styled, { keyframes } from 'styled-components';

export const ConnectedWalletWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 15px 10px 20px;
    border-radius: 60px;
    background: #ffffff40;
`;

export const StatusWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
`;

const pulse = keyframes`
    0% {
        opacity: 1;
    }
    50% {
        opacity: 0.7;
    }
    100% {
        opacity: 1;
    }
`;
export const ActiveDot = styled.div`
    width: 9px;
    height: 8px;
    border-radius: 100%;
    background: rgba(26, 134, 80, 1);
    animation: ${pulse} 2s infinite;
`;

export const WalletContentsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 15px;
`;

export const WalletValue = styled.div`
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: white;
    color: black;
    gap: 16px;
    font-family: Poppins;
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
    svg {
        height: 20px;
    }
`;

export const WalletValueLeft = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
`;

export const WalletValueRight = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: rgba(102, 102, 102, 0.15);
    padding: 3px 8px;
    border-radius: 100px;
`;
