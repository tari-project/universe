import { Box, Stack, styled } from '@mui/material';

export const HorisontalBox = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat( auto-fit, minmax(200px, 1fr) )',
    alignItems: 'center',
    gap: theme.spacing(1),
    justifyItems: 'start',
}));

export const RightHandColumn = styled(Box)(({ theme }) => ({
    [theme.breakpoints.up('sm')]: {
        justifySelf: 'end',
    },
    [theme.breakpoints.down('sm')]: {
        justifySelf: 'start',
    },
}));

export const CardContainer = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(1),
}));

export const CardItem = styled(Stack)(({ theme }) => ({
    padding: theme.spacing(1, 1.5),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: '0px 4px 45px 0px rgba(0, 0, 0, 0.08)',
}));
