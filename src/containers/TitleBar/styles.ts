import { styled } from '@mui/material/styles';
import { IconButton } from '@mui/material';

const buttonSize = '14px';
const colors = {
  close: '#ED695E',
  closeDark: '#D24F43',
  minMax: '#F6BD50',
  minMaxDark: '#D8A040',
  maximize: '#61C354',
  maximizeDark: '#51A73E',
  icon: '#000',
};

export const MinMaxStyle = {
  transform: 'rotate(135deg)',
};

export const CloseButton = styled(IconButton)({
  backgroundColor: colors.close,
  border: `1px solid ${colors.closeDark}`,
  height: buttonSize,
  width: buttonSize,
  boxShadow: 'none',
  padding: 0,
  color: colors.close,
  '&:hover': {
    backgroundColor: colors.close,
    borderColor: colors.closeDark,
    color: colors.icon,
  },
});

export const TitleBarContainer = styled('div')({
  height: '40px',
  userSelect: 'none',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
});

export const MinimizeButton = styled(IconButton)({
  backgroundColor: colors.minMax,
  border: `1px solid ${colors.minMaxDark}`,
  height: buttonSize,
  width: buttonSize,
  boxShadow: 'none',
  padding: 0,
  color: colors.minMax,
  '&:hover': {
    backgroundColor: colors.minMax,
    borderColor: colors.minMaxDark,
    color: colors.icon,
  },
});

export const ToggleButton = styled(IconButton)({
  backgroundColor: colors.maximize,
  border: `1px solid ${colors.maximizeDark}`,
  height: buttonSize,
  width: buttonSize,
  boxShadow: 'none',
  padding: 0,
  color: colors.maximize,
  '&:hover': {
    backgroundColor: colors.maximize,
    borderColor: colors.maximizeDark,
    color: colors.icon,
  },
});
