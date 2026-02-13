import styled from 'styled-components';

export const SwapsContainer = styled.div`
    display: flex;
    align-items: flex-end;
    flex-direction: column;
    width: 100%;
    height: 100%;
    position: relative;
`;
export const BackButton = styled.button`
    border-radius: 43px;
    padding: 4px 8px;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    font-family: Poppins, sans-serif;
    font-weight: 500;
    font-size: 10px;
    line-height: 1;
`;
export const SectionHeaderWrapper = styled.div`
    width: 100%;
    padding: 0 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const SwapsIframe = styled.iframe<{ $walletConnectOpen: boolean; $swapHeight: number }>`
    width: 100%;
    box-sizing: border-box;
    border: none;
    pointer-events: all;
    border-radius: ${({ $walletConnectOpen }) => ($walletConnectOpen ? '30px' : '20px')};
    height: ${({ $walletConnectOpen, $swapHeight }) => ($walletConnectOpen ? 470 : $swapHeight || 397)}px;
    will-change: height;
    transition: all 0.1s ease;
`;

export const IframeContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex: 1 0 auto;
    align-items: flex-end;
`;
