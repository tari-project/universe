import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
`;
export const HiddenContainer = styled.div`
    background-color: ${({ theme }) => theme.palette.background.default};
    width: 100%;
    border-radius: 10px;
    align-items: center;
    height: 40px;
    border: 1px solid ${({ theme }) => theme.palette.colors.darkAlpha[10]};
    display: flex;
    padding: 6px 10px 0;
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 18px;
    font-weight: 500;
`;
export const SeedWordsContainer = styled.div`
    position: relative;
    display: grid;
    grid-template-rows: repeat(6, 1fr);
    grid-auto-flow: column;
    gap: 15px;
    background-color: ${({ theme }) => theme.palette.background.default};
    width: 100%;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.palette.colors.darkAlpha[10]};
    padding: 20px;
`;

export const CopyIconContainer = styled.div`
    color: ${({ theme }) => theme.palette.text.primary};
`;
