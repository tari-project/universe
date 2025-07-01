import styled from 'styled-components';

export const TileItem = styled.div<{ $unpadded?: boolean }>`
    padding: 9px 15px;
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    box-shadow: 2px 8px 8px 0 rgba(0, 0, 0, 0.04);
    width: calc(33% - 12px);
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    height: 60px;
    color: ${({ theme }) => theme.palette.text.accent};
    font-size: 12px;
    font-weight: 500;
    position: relative;
`;

export const TileTop = styled.div`
    display: flex;
    justify-content: space-between;
`;
