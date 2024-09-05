import styled from 'styled-components';

export const MinerContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
`;

export const TileContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
`;

export const TileItem = styled.div`
    width: 155px;
    height: 61px;

    padding: 10px;
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    box-shadow: 2px 8px 8px 0 rgba(0, 0, 0, 0.04);
    max-width: 152px;
    gap: 6px;
    display: flex;

    flex-direction: column;
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 12px;
    font-weight: 500;
`;
export const TileTop = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
`;

export const StatWrapper = styled.div<{ $useLowerCase?: boolean }>`
    display: flex;
    gap: 2px;
    align-items: baseline;
    color: ${({ theme }) => theme.palette.text.primary};
    text-transform: ${({ $useLowerCase }) => $useLowerCase && 'lowercase'};
`;
