import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

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
