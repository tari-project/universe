import { styled } from '@mui/material/styles';
import { Box, LinearProgress, Chip, Button } from '@mui/material';
import { headerHeight, sidebarWidth } from '../../theme/styles';
import cardbg from '../../assets/images/card.png';
import { keyframes } from '@emotion/react';
import gem from '../../assets/images/gem-sml.png';

interface SideBarContainerProps {
    sidebaropen: boolean;
}

interface BalanceChangeProps {
    direction: 'up' | 'down';
}

// SideBar
export const SideBarContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'sidebaropen',
})<SideBarContainerProps>(({ theme, sidebaropen }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: 20,
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(1),
    pointerEvents: 'all',
    marginBottom: theme.spacing(1),
    marginTop: 0,
    // position: 'absolute',
    top: headerHeight,
    left: 0,
    height: `calc(100vh - ${headerHeight} - ${theme.spacing(2)})`,
    width: sidebaropen ? `calc(100% - ${theme.spacing(2)})` : sidebarWidth,
    zIndex: 100,
    transition: 'width 0.5s ease-in-out',
    display: 'flex',
    flexShrink: '0',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    boxShadow: '0px 0px 45px 0px rgba(0, 0, 0, 0.15)',
}));

export const SideBarInner = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    height: '100%',
    overflowY: 'auto',
    paddingLeft: theme.spacing(1.6),
    paddingRight: theme.spacing(1.6),
    paddingTop: theme.spacing(2.5),
    paddingBottom: theme.spacing(2.5),
}));

export const BottomContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

export const HeadingContainer = styled(Box)(({ theme }) => ({
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(2.2),
}));

const fadeIn = keyframes`
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 100px;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    max-height: 100px;
  }
  to {
    opacity: 0;
    max-height: 0;
  }
`;

// Wallet
export const WalletContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: theme.spacing(0),
    backgroundImage: `url(${cardbg})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'top left',
    padding: theme.spacing(1),
    borderRadius: '20px',
    width: `calc(${sidebarWidth} - ${theme.spacing(2)})`,
    boxShadow: '4px 4px 10px 0px rgba(0, 0, 0, 0.30)',
    '&:hover .hover-stack': {
        display: 'flex',
        animation: `${fadeIn} 0.8s ease-in-out forwards`,
    },
    '&:not(:hover) .hover-stack': {
        opacity: 0,
        maxHeight: 0,
        animation: `${fadeOut} 0.8s ease-in-out forwards`,
    },
}));

export const HoverStack = styled(Box)(() => ({
    display: 'flex',
    opacity: 0,
    maxHeight: 0,
    overflow: 'hidden',
    width: '100%',
    transition: 'opacity 0.8s ease-in-out, max-height 0.8s ease-in-out',
    '&.active': {
        opacity: 1,
        maxHeight: '100px',
    },
}));

export const AddressBox = styled(Box)(({ theme }) => ({
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(2),
    padding: '5px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    transition: 'color 0.5s ease-in-out',
}));

export const Handle = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.text.secondary,
    width: '52px',
    height: '3px',
    borderRadius: '2px',
}));

export const BalanceChangeChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'direction',
})<BalanceChangeProps>(({ theme, direction }) => ({
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: `1px solid ${theme.palette.divider}`,
    color: direction === 'up' ? theme.palette.success.main : theme.palette.error.main,
    borderRadius: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    transition: 'color 0.5s ease-in-out',
    '& .MuiChip-icon': {
        color: direction === 'up' ? theme.palette.success.main : theme.palette.error.main,
        transform: direction === 'up' ? 'rotate(0deg)' : 'rotate(180deg)',
        transition: 'color 0.5s ease-in-out, transform 0.5s ease-in-out',
    },
    '& .MuiChip-label': {
        paddingLeft: '6px',
        paddingRight: '6px',
        fontSize: '12px',
    },
}));

export const WalletButton = styled(Button)(({ theme }) => ({
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: theme.palette.primary.contrastText,
    borderRadius: '20px',
    border: `1px solid ${theme.palette.divider}`,
    padding: '10px',
    height: '34px',
    '&:hover': {
        backgroundColor: theme.palette.divider,
    },
}));

// Milestones
export const ProgressBox = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    padding: '3px',
    borderRadius: '10px',
    width: '100%',
    border: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(0.1),
    position: 'relative',
}));

export const StyledLinearProgress = styled(LinearProgress)(() => ({
    '& .MuiLinearProgress-bar': {
        background: 'linear-gradient(90deg, #FF7D45 0%, #FFB660 99.49%)',
        borderRadius: '5px',
    },
    backgroundColor: 'transparent',
    padding: '3px',
    borderRadius: '10px',
    flexGrow: 1,
}));

export const GemBox = styled(Box)(() => ({
    backgroundImage: `url(${gem})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '8px',
    width: '14px',
    height: '14px',
    position: 'absolute',
    right: '1px',
    borderRadius: '50%',
    border: `1px solid #D3D3D3`,
}));
