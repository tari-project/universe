import styled from 'styled-components';

export const MinerContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 6px;
    box-sizing: border-box;
`;

export const TileContainer = styled.div`
    width: 100%;
    display: flex;
    justify-content: stretch;
    align-items: stretch;
    flex-wrap: wrap;
    gap: 6px;
`;

export const TileItem = styled.div<{ $unpadded?: boolean }>`
    padding: 8px;
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    box-shadow: 2px 8px 8px 0 rgba(0, 0, 0, 0.04);
    width: calc(33% - 12px);
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 3px;
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

export const StatWrapper = styled.div<{ $useLowerCase?: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    color: ${({ theme }) => theme.palette.text.primary};
    min-height: 18px;

    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 100%;
    text-transform: ${({ $useLowerCase }) => ($useLowerCase ? 'lowercase' : 'uppercase')};
`;

export const LoaderWrapper = styled.div`
    height: 18px;
    display: flex;
    align-items: center;
`;

export const Unit = styled.div`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 10px;
    font-style: normal;
    font-weight: 500;
    line-height: 100%;
`;
