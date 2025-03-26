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

export const TileItem = styled.div<{ $unpadded?: boolean }>`
    height: 61px;
    padding: ${({ $unpadded }) => ($unpadded ? '' : '9px 15px')};

    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    box-shadow: 2px 8px 8px 0 rgba(0, 0, 0, 0.04);

    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;

    color: ${({ theme }) => theme.palette.text.secondary};
    font-family: Poppins, sans-serif;
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

    font-size: 18px;
    font-style: normal;
    font-weight: 500;
    line-height: 100%;
    text-transform: ${({ $useLowerCase }) => ($useLowerCase ? 'lowercase' : 'uppercase')};
`;

export const Unit = styled.div`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 10px;
    font-style: normal;
    font-weight: 500;
    line-height: 100%;
`;
