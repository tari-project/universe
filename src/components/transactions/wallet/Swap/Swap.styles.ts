import styled from 'styled-components';

export const SwapsContainer = styled.div``;
export const BackButton = styled.button`
    border-radius: 43px;
    padding: 2px 8px;
    gap: 3px;
    border-width: 1px;
    border: 1px solid ${({ theme }) => theme.palette.divider};

    font-family: Poppins, sans-serif;
    font-weight: 500;
    font-size: 10px;
`;
export const SectionHeaderWrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    align-items: center;
`;

export const SwapsIframe = styled.iframe<{ $walletConnectOpen: boolean }>`
    width: 100%;
    height: 100%;
    min-height: ${({ $walletConnectOpen }) => ($walletConnectOpen ? '470px' : '397px')};
    border: none;
    pointer-events: all;
    border-radius: ${({ $walletConnectOpen }) => ($walletConnectOpen ? '30px' : '20px')};
    overflow: hidden;
    transition: all 0.3s ease-in-out;
`;

export const IframeContainer = styled.div`
    width: 100%;
    height: 100%;
    min-height: 350px;
    display: flex;
    justify-content: center;
    align-items: center;
`;
