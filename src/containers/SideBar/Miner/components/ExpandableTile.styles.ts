import styled from 'styled-components';

import { motion } from 'framer-motion';

export const TriggerWrapper = styled.div`
    width: 14px;
    height: 14px;
    background: ${({ theme }) => theme.palette.colors.darkAlpha[10]};
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;
`;

export const ExpandableTileItem = styled(motion.div)`
    flex-grow: 1;
    min-width: 140px;
    padding: 10px;
    min-height: 65px;
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    box-shadow: 2px 8px 8px 0 rgba(0, 0, 0, 0.04);
    gap: 8px;
    display: flex;
    flex-direction: column;
    color: ${({ theme }) => theme.palette.text.secondary};
    font-size: 12px;
    font-weight: 500;
`;
export const ExpandedWrapper = styled(motion.div)`
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
`;

export const ExpandedContentTile = styled.div`
    display: flex;
    padding: 5px 10px 10px;
    flex-direction: column;
    gap: 8px;
    border-radius: 10px;
    background: ${({ theme }) => theme.palette.colors.darkAlpha[5]};

    font-size: 12px;
    font-weight: 500;
`;
