import styled from 'styled-components';

export const DisplayWrapper = styled.div<{ $rows?: number; $isHidden?: boolean }>`
    width: 100%;
    padding: ${({ $isHidden }) => ($isHidden ? `4px 10px` : `20px`)};
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    background-color: ${({ theme }) => theme.palette.background.default};
    grid-template-rows: ${({ $rows = 4 }) => `repeat(${$rows}, 1fr)`};
    grid-auto-flow: column;
    display: grid;
    gap: 15px;
    position: relative;
`;

export const CTAWrapper = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
`;
export const HiddenWrapper = styled.div`
    span {
        vertical-align: bottom;
        line-height: 1;
        letter-spacing: 0.12em;
    }
`;
export const WordsWrapper = styled.div`
    display: flex;
    gap: 2px;
`;

export const AddSeedWordsWrapper = styled.div`
    display: flex;
    padding: 6px 4px;
    color: ${({ theme }) => theme.palette.text.secondary};
`;
