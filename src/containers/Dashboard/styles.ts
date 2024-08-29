import { styled } from '@mui/material/styles';
import { LinearProgress, Box, Typography } from '@mui/material';

export const DashboardContainer = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    pointerEvents: 'none',
    justifyContent: 'center',
    height: '100%',
    flexGrow: '1',
    position: 'relative',
    zIndex: '1',
}));

export const ProgressBox = styled(Box)(() => ({
    backgroundColor: '#fff',
    padding: '3px',
    borderRadius: '10px',
    overflow: 'hidden',
    width: '400px',
    boxSizing: 'content-box',
}));

export const StyledLinearProgress = styled(LinearProgress)(() => ({
    '& .MuiLinearProgress-bar': {
        backgroundColor: '#000',
        borderRadius: '5px',
    },
    backgroundColor: '#fff',
}));

export const VisualModeContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: theme.spacing(1),
    pointerEvents: 'all',
    borderRadius: '24px',
    gap: theme.spacing(1),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
}));

export const SetupDescription = styled(Typography)(({ theme }) => ({
    color: `${theme.palette.text.primary} !important`,
    fontFamily: '"PoppinsRegular", sans-serif',
    fontSize: '15px',
    textAlign: 'center',
}));

export const SetupPercentage = styled(Typography)(({ theme }) => ({
    color: `${theme.palette.text.primary} !important`,
    fontFamily: '"PoppinsBold", sans-serif',
    fontSize: '15px',
    textAlign: 'center',
}));
