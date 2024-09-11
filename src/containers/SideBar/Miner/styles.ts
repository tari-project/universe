import styled from 'styled-components';
import { motion } from 'framer-motion';

export const MinerContainer = styled(motion.div)`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
`;

export const TileItem = styled(motion.div)`
    height: 65px;
    width: 155px;
    flex-shrink: 1;
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
    position: relative;
`;
export const TileTop = styled(motion.div)`
    display: flex;
    justify-content: space-between;
`;

export const StatWrapper = styled(motion.div)<{ $useLowerCase?: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    color: ${({ theme }) => theme.palette.text.primary};
`;
export const Unit = styled(motion.div)`
    line-height: 1;
    font-size: 10px;
`;

export const TileContainer = styled(motion.div)`
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    gap: 6px;
`;
