import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    max-height: 76vh;
    overflow-y: auto;
    scrollbar-width: auto;
    scrollbar-color: rgba(0, 0, 0, 0.15) rgba(0, 0, 0, 0.05);
    scrollbar-gutter: stable both-edges;

    &::-webkit-scrollbar {
        scrollbar-width: auto;
        width: 5px;
        display: block !important;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.palette.divider};
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: ${({ theme }) => theme.palette.text.accent};
    }
`;

export const EmojiAddressWrapper = styled.div`
    display: flex;
    width: 100%;
    line-height: 1.4;
    letter-spacing: 2px;
    font-size: 13px;
`;
