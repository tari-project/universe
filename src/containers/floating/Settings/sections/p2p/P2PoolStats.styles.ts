import styled, { css } from 'styled-components';
import { CSSProperties } from 'react';

export const Tbody = styled.tbody``;
export const Thead = styled.thead``;
export const Th = styled.th`
    text-align: left;
`;
export const Tr = styled.tr``;
export const Td = styled.td``;

export const Table = styled.div`
    display: grid;
    width: 100%;
`;

export const TableRow = styled.div<{ $isHeadingRow?: boolean; $altBg?: boolean }>`
    display: grid;
    width: 100%;
    gap: 2px;
    grid-template-columns: minmax(max-content, 40px) 4fr 1fr 1fr 2fr;
    justify-content: center;
    background-color: ${({ $altBg }) => ($altBg ? 'rgba(0, 0, 0, .02)' : 'none')};
    ${({ $isHeadingRow }) =>
        $isHeadingRow &&
        css`
            border-bottom: 1px solid deeppink;
        `}
`;

export const Cell = styled.div<{ $alignment?: CSSProperties['alignItems'] }>`
    display: flex;
    padding: 4px 2px;
    font-size: 12px;
    align-items: center;
    justify-content: ${({ $alignment = 'end' }) => $alignment};
`;
