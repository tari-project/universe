import { styled } from '@mui/material/styles';
import { LinearProgress, Box } from '@mui/material';
import { headerHeight } from '../../theme/styles';

export const DashboardContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const ProgressBox = styled(Box)(() => ({
  backgroundColor: '#fff',
  padding: '3px',
  borderRadius: '10px',
  width: '400px',
}));

export const StyledLinearProgress = styled(LinearProgress)(() => ({
  '& .MuiLinearProgress-bar': {
    backgroundColor: '#000',
    borderRadius: '5px',
  },
  backgroundColor: '#fff',
  padding: '3px',
  borderRadius: '10px',
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

export const BlockInfoContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: `calc(${headerHeight} + ${theme.spacing(1)})`,
  right: theme.spacing(4),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
}));
