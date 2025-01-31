import styled from 'styled-components';

import { m } from 'motion/react';
import { convertHexToRGBA } from '@app/utils/convertHex.ts';

export const TriggerWrapper = styled(m.div)`
    width: 14px;
    height: 14px;
    background: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const ExpandableTileItem = styled(m.div)`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    color: ${({ theme }) => theme.palette.text.primary};
`;
export const ExpandedWrapper = styled(m.div)`
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
    background: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.04)};
    font-size: 12px;
    font-weight: 500;
`;
