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

export const OperationsSection = styled.div`
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const OperationsTitle = styled.h3`
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 12px 0;
    padding: 12px 0 8px 0;
    color: ${({ theme }) => theme.palette.text.primary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.8;
`;
