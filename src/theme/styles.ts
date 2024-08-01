import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

export const headerHeight = '40px';
export const sidebarWidth = '368px';

export const ContainerInner = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  justifyContent: 'center',
  gap: theme.spacing(2),
  minHeight: `calc(100vh - ${headerHeight})`,
  paddingLeft: sidebarWidth,
}));

export const DashboardContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflowY: 'auto',
  paddingTop: headerHeight,
}));
