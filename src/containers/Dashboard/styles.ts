import { styled } from '@mui/material/styles';
import { LinearProgress, Box, Typography } from '@mui/material';
import { headerHeight, sidebarWidth } from '../../theme/styles';

export const DashboardContainer = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: '24px',
    gap: theme.spacing(1),
    position: 'absolute',
    bottom: theme.spacing(1),
    right: theme.spacing(1),
}));

export const InfoContainer = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: `calc(${headerHeight} + ${theme.spacing(1)})`,
    right: theme.spacing(4),
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: `calc(100% - ${sidebarWidth} - ${theme.spacing(8)})`,
    gap: theme.spacing(2),
}));

export const SetupDescription = styled(Typography)(({ theme }) => ({
    color: `${theme.palette.text.primary} !important`,
    fontFamily: '"PoppinsRegular", sans-serif',
    fontSize: '15px',
    textAlign: 'center',
}));

export const SetupPercentage = styled(Typography)(({ theme }) => ({
    color: `${theme.palette.text.primary} !important`,
    fontFamily: '"PoppinsLight", sans-serif',
    fontSize: '18px',
    textAlign: 'center',
}));
