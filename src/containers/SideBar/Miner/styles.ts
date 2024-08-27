import { styled } from '@mui/material/styles';
import { Button, Box } from '@mui/material';

export const MinerContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));

export const TileContainer = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(0.6),
}));

export const TileItem = styled(Box)(({ theme }) => ({
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: '0px 4px 45px 0px rgba(0, 0, 0, 0.08)',
}));

export const ScheduleButton = styled(Button)(({ theme }) => ({
    backgroundColor: `${theme.palette.background.default} !important`,
    color: theme.palette.text.secondary,
    '&:hover': {
        backgroundColor: `${theme.palette.divider} !important`,
    },
}));

export const StatWrapper = styled('div')`
    display: flex;
    gap: 2px;
    align-items: baseline;
`;
