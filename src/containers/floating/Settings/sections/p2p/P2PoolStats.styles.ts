import styled, { css } from 'styled-components';
import { CSSProperties } from 'react';

export const TableOverflowWrapper = styled.div`
    overflow: hidden;
    overflow-y: auto;
    height: auto;

    padding: 0 8px 0 0;

    &::-webkit-scrollbar {
        width: 3px;
        display: unset;
    }
    &::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-track {
        background-color: rgba(0, 0, 0, 0.1);
    }
`;

export const Table = styled.div`
    display: grid;
    width: 100%;
    overflow: hidden;
`;

export const TableRow = styled.div<{ $isHeadingRow?: boolean; $altBg?: boolean }>`
    display: grid;
    width: 100%;
    gap: 2px;
    grid-template-columns: 0.8fr 6fr repeat(3, 5fr);
    justify-content: center;
    background-color: ${({ $altBg }) => ($altBg ? 'rgba(0, 0, 0, 0.02)' : 'none')};
    height: min-content;
    ${({ $isHeadingRow }) =>
        $isHeadingRow &&
        css`
            white-space: pre;
            padding: 6px 0;
        `}
`;

export const Cell = styled.div<{ $alignment?: CSSProperties['alignItems'] }>`
    display: flex;
    font-variant-numeric: tabular-nums;
    padding: 4px 2px;
    font-size: 12px;
    align-items: center;
    text-align: right;
    justify-content: ${({ $alignment = 'end' }) => $alignment};

    p {
        font-size: 11px;
        color: ${({ theme }) => theme.palette.text.secondary};
    }

    img {
        height: 11px;
    }
`;

export const StatWrapper = styled.div`
    display: flex;
    width: 100%;
    font-size: 11px;
    justify-content: space-between;
    align-items: center;
    line-height: 12px;
`;
