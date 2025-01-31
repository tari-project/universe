import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { m } from 'motion';

export const BlockTimeContainer = styled(m.div)`
    display: flex;
    flex-direction: column;
    font-weight: 500;
    position: relative;
    align-items: flex-end;
`;

export const TitleTypography = styled(Typography)`
    font-size: 13px;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const TimerTypography = styled.div`
    font-family: DrukWide, sans-serif;
    font-weight: 800;
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
