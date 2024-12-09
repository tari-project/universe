import styled from 'styled-components';
import { TbAlertTriangle } from 'react-icons/tb';
import { m } from 'framer-motion';

export const AlertWrapper = styled.div`
    display: flex;
    position: relative;
`;

export const AlertIcon = styled(TbAlertTriangle)`
    display: flex;
    margin-top: 3px;
    color: ${({ theme }) => theme.palette.warning.main};
    flex-shrink: 0;
`;
export const TooltipTrigger = styled.div`
    cursor: pointer;
    display: flex;
    padding: 4px 8px;
    flex-direction: row;
    font-size: 12px;
    letter-spacing: -1.8px;
    align-items: flex-start;
    gap: 6px;
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
