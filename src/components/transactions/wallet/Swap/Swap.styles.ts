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

export const SwapsIframe = styled.iframe<{ $walletConnectOpen: boolean; $swapHeight: number }>`
    width: 100%;
    height: 100%;
    min-height: ${({ $walletConnectOpen, $swapHeight }) => ($walletConnectOpen ? 470 : $swapHeight || 397)}px;
    border: none;
    pointer-events: all;
    border-radius: ${({ $walletConnectOpen }) => ($walletConnectOpen ? '30px' : '20px')};
    overflow: hidden;
    transition: all 0.1s ease;
`;

export const IframeContainer = styled.div`
    width: 100%;
    height: 100%;
    min-height: 320px;
    display: flex;
    align-items: center;
`;
