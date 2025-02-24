import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const BlockTimeContainer = styled.div`
    display: flex;
    flex-direction: column;
    font-weight: 500;
    position: relative;
    align-items: flex-end;
    padding-right: 10px;
    z-index: 1;

    &:after {
        content: '';
        position: absolute;
        background: linear-gradient(150deg, transparent 50%, #fff 90%);
        right: 0;
        bottom: 0;
        width: 130px;
        height: 120px;
        z-index: 0;
    }
`;

export const TitleTypography = styled(Typography)`
    font-size: 13px;
    color: ${({ theme }) => theme.palette.text.secondary};
    z-index: 1;
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
    z-index: 1;
`;

export const SpacedNum = styled('span')`
    font-variant-numeric: tabular-nums;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1ch;
`;
