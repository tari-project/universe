import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

export const headerHeight = '40px';
export const sidebarWidth = '368px';

export const ContainerInner = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  gap: theme.spacing(2),
  minHeight: `calc(100vh - ${headerHeight})`,
  '& > :first-of-type': {
    width: sidebarWidth,
  },
  '& > :nth-child(2)': {
    flexGrow: 1,
  },
}));

export const DashboardContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflowY: 'auto',
  paddingTop: headerHeight,
}));
