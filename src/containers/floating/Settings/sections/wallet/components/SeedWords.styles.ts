import styled from 'styled-components';

export const Wrapper = styled.div<{ $seedWordsVisible?: boolean }>`
    display: flex;
    align-items: ${({ $seedWordsVisible }) => ($seedWordsVisible ? 'flex-start' : 'center')};
    justify-content: space-between;
    width: 100%;
    gap: 10px;
`;
export const HiddenContainer = styled.div`
    background-color: ${({ theme }) => theme.palette.background.default};
    width: 100%;
    border-radius: 10px;
    align-items: center;
    height: 40px;
    border: 1px solid ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    display: flex;
    padding: 6px 10px 0;
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 18px;
    font-weight: 500;
`;
export const SeedWordsContainer = styled.div<{ $rows?: number }>`
    position: relative;
    display: grid;
    grid-template-rows: ${({ $rows = 6 }) => `repeat(${$rows}, 1fr)`};
    grid-auto-flow: column;
    gap: 15px;
    background-color: ${({ theme }) => theme.palette.background.default};
    width: 100%;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.colorsAlpha.darkAlpha[10]};
    padding: 20px;
`;

export const IconContainer = styled.div`
    color: ${({ theme }) => theme.palette.text.primary};
`;
