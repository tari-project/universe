import styled from 'styled-components';

export const CardGrid = styled.div`
    display: grid;
    width: 100%;
    grid-template-columns: repeat(auto-fill, minmax(max(calc(25% - 24px), 210px), 1fr));
    grid-auto-rows: 1fr;
    gap: 8px;
`;

export const InfoCard = styled.div`
    background-color: ${({ theme }) => theme.palette.background.accent};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    color: ${({ theme }) => theme.palette.text.secondary};
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 6px 8px;
    width: 100%;
    gap: 4px;
`;

export const TitleCodeBlock = styled.code`
    display: flex;
    font-weight: 700;
    font-size: 12px;
    background-color: ${({ theme }) => theme.palette.background.paper};
    color: ${({ theme }) => theme.palette.text.secondary};
    border-radius: 5px;
    padding: 2px 4px;
    width: max-content;
    margin: 4px 0;
`;

export const InfoContent = styled.div`
    padding: 0 0 0 4px;
    display: inline-flex;
    overflow: hidden;
    flex-wrap: wrap-reverse;
    column-gap: 4px;
`;

export const InfoLabel = styled.div`
    font-size: 11px;
    white-space: nowrap;
    flex-basis: calc(50% - 2px);

    font-weight: 500;
    flex-grow: 1;
    flex-shrink: 0;
`;
