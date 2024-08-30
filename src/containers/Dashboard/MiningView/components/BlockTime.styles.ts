import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const BlockTimeContainer = styled.div`
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
`;

export const TitleTypography = styled(Typography)`
    font-family: 'PoppinsRegular', sans-serif;
    font-size: 13px;
    color: theme.palette.text.secondary;
`;

export const TimerTypography = styled.div`
    font-family: 'DrukWideLCGBold', sans-serif;
    font-variant-numeric: tabular-nums;
    font-size: 18px;
    color: ${({ theme }) => theme.palette.text.primary};
    gap: 2px;
    display: flex;
    text-transform: uppercase;
`;

export const SpacedNum = styled('span')`
    font-variant-numeric: tabular-nums;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1ch;
`;
