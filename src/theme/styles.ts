import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

export const headerHeight = '20px';
export const sidebarWidth = '348px'; // if this is updated please update the value in init-visuals.js

export const ContainerInner = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    pointerEvents: 'none',
    gap: theme.spacing(2),
    minHeight: '100%',
}));

export const DashboardContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflowY: 'auto',
    padding: `${headerHeight} ${theme.spacing(2)} ${theme.spacing(2)}`,
    pointerEvents: 'none',
    flexGrow: '1',
    position: 'relative',
    gap: theme.spacing(2),
}));
