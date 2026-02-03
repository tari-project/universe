import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    max-height: 70vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0;

    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.colorsAlpha.greyscaleAlpha[20]};
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: ${({ theme }) => theme.colorsAlpha.greyscaleAlpha[30]};
    }
`;

export const EmojiAddressWrapper = styled.div`
    display: flex;
    width: 100%;
    line-height: 1.4;
    letter-spacing: 2px;
    font-size: 13px;
`;

export const OperationsSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: ${({ theme }) => `1px solid ${theme.colorsAlpha.greyscaleAlpha[20]}`};
    padding: 0 0 10px;
`;

export const OperationsTitle = styled.h3`
    font-size: 14px;
    font-weight: 600;
    margin: max(8px, 0.9vh) 0 0;
    color: ${({ theme }) => theme.palette.text.primary};
    text-transform: uppercase;
    letter-spacing: 0.001rem;
    opacity: 0.8;
`;
