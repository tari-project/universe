import styled, { css } from 'styled-components';
import { CSSProperties } from 'react';

export const TableOverflowWrapper = styled.div`
    overflow-y: auto;
    height: 100%;
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
    height: auto;
    max-height: 25vh;
    overflow: hidden;
`;

export const TableRow = styled.div<{ $isHeadingRow?: boolean; $altBg?: boolean }>`
    display: grid;
    width: 100%;
    gap: 2px;
    grid-template-columns: 0.8fr 6fr repeat(3, 5fr);
    justify-content: center;
    background-color: ${({ $altBg }) => ($altBg ? 'rgba(0, 0, 0, 0.02)' : 'none')};
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
`;

export const StatWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
`;
