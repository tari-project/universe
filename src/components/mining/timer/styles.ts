import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export type MiningTimeVariant = 'primary' | 'mini';

export const Wrapper = styled.div`
    display: flex;
`;
export const MiniWrapper = styled.div`
    width: 100%;
    gap: 3px;
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.palette.text.contrast};
    background-color: ${({ theme }) => theme.palette.contrast};
    padding: 4px 7px;
    border-radius: 50px;
    line-height: 1;
    font-size: 11px;
    font-weight: 700;
    height: 16px;
`;

export const TimerDot = styled.div`
    border-radius: 50%;
    background-color: #33cd7e;
    width: 7px;
    height: 7px;
`;

export const TimerTextWrapper = styled.div`
    display: flex;
    gap: 0.05ch;
    align-items: baseline;
`;

export const SpacedNum = styled(Typography)`
    font-variant-numeric: tabular-nums;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1ch;
`;
