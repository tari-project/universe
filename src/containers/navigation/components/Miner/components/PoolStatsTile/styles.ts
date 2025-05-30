import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';
import * as m from 'motion/react-m';

const bg = '#188750';
const bg_loading = '#CC7A1C';
export const Wrapper = styled.div<{ $isLoading?: boolean }>`
    height: 60px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid ${({ $isLoading }) => convertHexToRGBA($isLoading ? bg_loading : bg, 0.15)};
    box-shadow: 0 4px 12px -5px ${({ $isLoading }) => convertHexToRGBA($isLoading ? bg_loading : bg, 0.05)};
    background: ${({ $isLoading, theme }) =>
        `linear-gradient(99deg,  ${convertHexToRGBA($isLoading ? bg_loading : bg, 0.3)} -33%, ${theme.palette.background.default} 10%, ${convertHexToRGBA($isLoading ? bg_loading : bg, 0.2)} 190%)`};
    color: ${({ theme }) => theme.palette.text.accent};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    font-size: 12px;
    font-weight: 500;
    flex-shrink: 0;
    flex-grow: 6;
    padding: 7px 10px;
`;

export const LeftContent = styled.div`
    display: flex;
    height: 100%;
    justify-content: space-between;
    flex-direction: column;
`;
export const RightContent = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: end;
    height: 100%;
    position: relative;
`;

export const Values = styled.div`
    display: flex;
    align-items: baseline;
`;

export const Title = styled(Typography).attrs({ variant: 'h6' })`
    font-size: 12px;
    width: 100%;
`;

export const BalanceVal = styled(Typography)`
    font-size: 18px;
    color: ${({ theme }) => theme.palette.text.primary};
    vertical-align: bottom;
    letter-spacing: -0.4px;
`;

export const TriggerWrapper = styled(m.div)`
    width: 14px;
    height: 14px;
    background: ${({ theme }) => theme.palette.contrast};
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;
    color: ${({ theme }) => theme.palette.base};
`;

export const ExpandedWrapper = styled(m.div)`
    display: flex;
    background-color: ${({ theme }) => theme.palette.background.default};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    box-shadow: 2px 8px 8px 0 rgba(0, 0, 0, 0.04);
    flex-direction: column;
    gap: 6px;
    width: 340px;
    padding: 15px;
    h5,
    strong {
        margin: 0;
        color: ${({ theme }) => theme.palette.text.primary};
    }
`;

export const TooltipChipWrapper = styled.div`
    display: flex;
    padding: 4px 0 0;
    flex-direction: row;
    gap: 6px;
`;
export const TooltipChip = styled.div`
    display: flex;
    color: ${({ theme }) => theme.palette.text.contrast};
    background-color: ${({ theme }) => theme.palette.contrast};
    flex-direction: column;
    justify-content: space-between;
    border-radius: 10px;
    padding: 8px;
    flex-shrink: 1;
    flex-grow: 2;
    width: 100%;
`;

export const TooltipChipHeading = styled(Typography).attrs({ variant: 'p' })`
    white-space: nowrap;
    color: ${({ theme }) => theme.palette.text.secondary};
    font-weight: 500;
`;
export const TooltipChipText = styled(Typography).attrs({ variant: 'p' })`
    color: ${({ theme }) => theme.palette.text.contrast};
    font-size: 18px;
    font-weight: 500;
    letter-spacing: 1px;
    line-height: 1.1;
`;
