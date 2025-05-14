import styled from 'styled-components';

export const DisplayWrapper = styled.div<{ $rows?: number }>`
    width: 100%;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    background-color: ${({ theme }) => theme.palette.background.default};
    grid-template-rows: ${({ $rows = 4 }) => `repeat(${$rows}, 1fr)`};
    grid-auto-flow: column;
    display: grid;
    gap: 15px;
`;

export const WordsWrapper = styled.div`
    display: flex;
`;
