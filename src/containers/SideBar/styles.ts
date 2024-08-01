import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { headerHeight, sidebarWidth } from '../../theme/styles';

interface SideBarContainerProps {
  sidebaropen: boolean;
}

export const SideBarContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'sidebaropen',
})<SideBarContainerProps>(({ theme, sidebaropen }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
  marginTop: 0,
  position: 'absolute',
  top: headerHeight,
  left: 0,
  height: `calc(100vh - ${headerHeight} - ${theme.spacing(1)})`,
  width: sidebaropen ? `calc(100% - ${theme.spacing(2)})` : sidebarWidth,
  zIndex: 100,
  transition: 'width 0.5s ease-in-out',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  justifyContent: 'flex-start',
}));

export const SideBarInner = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  height: '100%',
  overflowY: 'auto',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
}));

export const BottomContainer = styled(Box)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

export const HeadingContainer = styled(Box)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(2),
}));

export const WalletContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  backgroundColor: theme.palette.background.default,
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  paddingLeft: theme.spacing(1.5),
  paddingRight: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
}));
