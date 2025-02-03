import styled from 'styled-components';

import * as m from 'motion/react-m';
import { convertHexToRGBA } from '@app/utils';

export const AlertWrapper = styled.div`
    display: flex;
    position: relative;
`;

export const AlertIconWrapper = styled.div`
    display: flex;
    background: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};
    color: ${({ theme }) => theme.palette.text.secondary};
    flex-shrink: 0;
    border-radius: 100%;
    width: 14px;
    height: 14px;
`;
export const TooltipTrigger = styled.div`
    cursor: pointer;
    display: flex;
    padding: 6px 8px 4px;
    flex-direction: row;
    font-size: 0.7rem;
    gap: 4px;
    align-items: flex-start;
    color: ${({ theme }) => theme.palette.warning.dark};
`;

export const TooltipWrapper = styled(m.div).attrs({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
})`
    display: flex;
    flex-direction: column;
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    background-color: ${({ theme }) => theme.palette.background.default};
    box-shadow: 2px 8px 8px 0 rgba(0, 0, 0, 0.04);
    position: absolute;
    padding: 6px 8px 10px;
    gap: 6px;
    left: 0;
    top: 100%;
    z-index: 2;
    width: 100%;
`;

export const TooltipTop = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    img {
        max-height: 12px;
    }
`;
