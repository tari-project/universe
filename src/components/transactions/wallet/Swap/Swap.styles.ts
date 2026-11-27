import styled from 'styled-components';

export const SwapsContainer = styled.div`
    display: flex;
    align-items: flex-end;
    flex-direction: column;
    width: 100%;
    position: relative;
`;
export const BackButton = styled.button`
    border-radius: 43px;
    padding: 6px 12px;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    background: transparent;
    color: ${({ theme }) => theme.palette.text.primary};
    font-family: Poppins, sans-serif;
    font-weight: 500;
    font-size: 11px;
    line-height: 1;
    cursor: pointer;
    transition:
        background-color 0.16s cubic-bezier(0.2, 0, 0, 1),
        border-color 0.16s cubic-bezier(0.2, 0, 0, 1),
        transform 0.12s cubic-bezier(0.2, 0, 0, 1);

    &:hover {
        background: ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.palette.text.primary};
        outline-offset: 2px;
    }

    &:active {
        transform: scale(0.98);
    }
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
    min-height: 160px;
    display: flex;
    flex: 1 0 auto;
    justify-content: center;
    align-items: center;
`;
