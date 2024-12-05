import styled, { css } from 'styled-components';
import { CSSProperties } from 'react';

export const Table = styled.div`
    display: grid;
    width: 100%;
`;

export const TableRow = styled.div<{ $isHeadingRow?: boolean; $altBg?: boolean }>`
    display: grid;
    width: 100%;
    gap: 2px;
    grid-template-columns: 1fr 6fr repeat(3, 5fr);
    justify-content: center;
    background-color: ${({ $altBg }) => ($altBg ? 'rgba(0, 0, 0, .02)' : 'none')};
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
`;
