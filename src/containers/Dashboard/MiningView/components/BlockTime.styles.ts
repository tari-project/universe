import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

export const BlockTimeContainer = styled(Box)(() => ({
    zIndex: 1,
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
    letterSpacing: '1px',
    color: `${theme.palette.text.primary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    textTransform: 'uppercase',
}));
