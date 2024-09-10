import styled from 'styled-components';

import { motion } from 'framer-motion';

export const TriggerWrapper = styled(motion.div)`
    width: 14px;
    height: 14px;
    background: ${({ theme }) => theme.palette.colors.darkAlpha[10]};
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;
`;

export const ExpandableTileItem = styled(motion.div)`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    color: ${({ theme }) => theme.palette.text.primary};
`;
export const ExpandedWrapper = styled(motion.div)`
    display: flex;
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    box-shadow: 2px 8px 8px 0 rgba(0, 0, 0, 0.04);
    flex-direction: column;
    gap: 8px;
    width: 216px;
    padding: 20px 12px;
    z-index: 2;
    position: absolute;
    top: 0;
    right: 0;
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
