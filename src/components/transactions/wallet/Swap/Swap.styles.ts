import styled from 'styled-components';

export const SwapsContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`;
export const BackButton = styled.button`
    border-radius: 43px;
    padding: 2px 8px;
    gap: 3px;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    font-family: Poppins, sans-serif;
    font-weight: 500;
    font-size: 10px;
`;
export const SectionHeaderWrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const SwapsIframe = styled.iframe<{ $walletConnectOpen: boolean; $swapHeight: number; $opacity: number }>`
    width: 100%;
    height: 100%;
    min-height: ${({ $walletConnectOpen, $swapHeight }) => ($walletConnectOpen ? 470 : $swapHeight || 395)}px;
    border: none;
    pointer-events: all;
    border-radius: ${({ $walletConnectOpen }) => ($walletConnectOpen ? '38px' : '20px')};
    margin-top: ${({ $walletConnectOpen }) => ($walletConnectOpen ? '10px' : '0')};
    overflow: hidden;
    opacity: ${({ $opacity }) => $opacity};
    transition: all 0.2s ease opacity 0.3s ease;
`;

export const IframeContainer = styled.div`
    width: 100%;
    height: 100%;
    min-height: 320px;
    display: flex;
    align-items: center;
`;
