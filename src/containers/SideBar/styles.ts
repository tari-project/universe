import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

export const SideBarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
  marginTop: 0,
}));
