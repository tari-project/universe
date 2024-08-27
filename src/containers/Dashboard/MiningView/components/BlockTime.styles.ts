import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

export const BlockTimeContainer = styled(Box)(() => ({
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
}));

export const TitleTypography = styled(Typography)(({ theme }) => ({
    fontFamily: '"PoppinsRegular", sans-serif',
    fontSize: '13px',
    color: theme.palette.text.secondary,
}));

export const TimerTypography = styled(Box)(({ theme }) => ({
    fontFamily: '"DrukWideLCGBold", sans-serif',
    fontVariantNumeric: 'tabular-nums',
    fontSize: '18px',
    color: `${theme.palette.text.primary}`,
    gap: `2px`,
    display: 'flex',
    textTransform: 'uppercase',
}));

export const SpacedNum = styled('span')`
    font-variant-numeric: tabular-nums;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1ch;
`;
