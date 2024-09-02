import { styled, Typography } from '@mui/material';

export const MoneroAddressInputTypography = styled(Typography)<{ component: string }>(({ theme }) => ({
    marginBottom: theme.spacing(1),
    lineHeight: '135%',
    display: 'inline-block',
    color: theme.palette.text.primary,
}));
