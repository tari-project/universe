import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';
import * as m from 'motion/react-m';

const bg = '#188750';
const bg_loading = '#CC7A1C';
export const Wrapper = styled.div<{ $isLoading?: boolean }>`
    height: 60px;
    padding: 0 15px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid ${({ $isLoading }) => convertHexToRGBA($isLoading ? bg_loading : bg, 0.15)};
    box-shadow: 0 4px 12px -5px ${({ $isLoading }) => convertHexToRGBA($isLoading ? bg_loading : bg, 0.05)};
    background: ${({ $isLoading, theme }) =>
        `linear-gradient(99deg,  ${convertHexToRGBA($isLoading ? bg_loading : bg, 0.3)} -33%, ${theme.palette.background.paper} 10%, ${convertHexToRGBA($isLoading ? bg_loading : bg, 0.2)} 190%)`};
    color: ${({ theme }) => theme.palette.text.accent};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    font-size: 12px;
    font-weight: 500;
    flex-shrink: 0;
    flex-grow: 6;
`;

export const LeftContent = styled.div`
    display: flex;
    gap: 4px;
    flex-direction: column;
`;
export const RightContent = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: end;
    gap: 4px;
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

export const MinPayoutVal = styled(Typography)`
    font-size: 10px;
    letter-spacing: -0.4px;
    vertical-align: bottom;
`;

export const TimerDot = styled.div`
    border-radius: 50%;
    background-color: #33cd7e;
    width: 7px;
    height: 7px;
`;
export const Timer = styled.div`
    width: 100%;
    gap: 3px;
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.palette.text.contrast};
    background-color: ${({ theme }) => theme.palette.contrast};
    padding: 2px 7px;
    border-radius: 50px;
`;

export const TriggerWrapper = styled(m.div)`
    width: 14px;
    height: 14px;
    background: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.9)};
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;
    color: ${({ theme }) => theme.palette.text.contrast};
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
`;
