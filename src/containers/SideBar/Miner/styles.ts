import styled from 'styled-components';
import { motion } from 'framer-motion';

export const MinerContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
`;

export const TileContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: stretch;
    align-items: stretch;
    width: 100%;
    gap: 6px;

    &:last-child {
        flex-grow: 2;
    }
`;

export const TileItem = styled.div`
    height: 65px;
    min-width: 140px;
    flex-shrink: 0;
    flex-grow: 1;
    padding: 10px;
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    box-shadow: 2px 8px 8px 0 rgba(0, 0, 0, 0.04);
    gap: 8px;
    display: flex;

    flex-direction: column;
    justify-content: space-between;

    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 12px;
    font-weight: 500;
`;
export const TileTop = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
`;

export const StatWrapper = styled(motion.div)<{ $useLowerCase?: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    color: ${({ theme }) => theme.palette.text.primary};
`;
export const Unit = styled.div`
    line-height: 1;
    font-size: 10px;
`;
