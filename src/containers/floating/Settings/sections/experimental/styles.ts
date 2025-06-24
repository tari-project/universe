import styled from 'styled-components';

export const CardGrid = styled.div`
    display: grid;
    width: 100%;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
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
    color: ${({ theme }) => theme.colors.green[600]};
    border-radius: 5px;
    padding: 2px 4px;
    width: max-content;
    margin: 4px 0;
`;

export const InfoContent = styled.div`
    border: 1px solid deeppink;
    padding: 0 0 0 8px;
`;

export const InfoLabel = styled.div`
    font-size: 11px;
    font-weight: 500;
`;
