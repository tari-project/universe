import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

interface BlockHeightBgProps {
    length: number;
}

const topHeight = 115;
const bottomHeight = 115;

export const BlockHeightContainer = styled(Box)(() => ({
    zIndex: 100,
    position: 'absolute',
    right: '20px',
    height: `calc(100vh - ${topHeight}px - ${bottomHeight}px)`,
    display: 'flex',
    flexDirection: 'column',
    top: `${topHeight}px`,
    overflow: 'visible',
}));

export const RulerContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    zIndex: 2,
}));

export const RulerMarkContainer = styled(Box)(() => ({
    display: 'flex',
    flexDirection: 'row',
    minWidth: '50px',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '3px',
    overflow: 'visible',
    gap: '10px',
}));

export const RulerMark = styled('div')(({ theme }) => ({
    width: '10px',
    height: '1px',
    backgroundColor: theme.palette.text.primary,
}));

export const BlockHeightLrg = styled(Box)(({ theme }) => ({
    fontFamily: '"DrukWideLCGBold", sans-serif',
    fontSize: '25px',
    letterSpacing: '1px',
    color: `${theme.palette.text.primary}`,
    position: 'absolute',
    top: 'calc(50% - 12px)',
    right: '15px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    zIndex: 2,
}));

export const BlockHeightSml = styled(Box)(({ theme }) => ({
    fontFamily: '"PoppinsBold", sans-serif',
    fontVariantNumeric: 'tabular-nums',
    fontSize: '11px',
    color: `${theme.palette.text.primary}`,
    opacity: 0.2,
}));

export const BlockHeightBg = styled(Box)<BlockHeightBgProps>(({ length }) => ({
    fontFamily: '"DrukWideLCGBold", sans-serif',
    letterSpacing: '1px',
    color: `rgba(255,255,255,0.4)`,
    textTransform: 'uppercase',
    position: 'absolute',
    width: `calc(100vh - ${topHeight}px - ${bottomHeight}px)`,
    top: '0',
    rotate: '270deg',
    zIndex: 1,
    transformOrigin: 'top right',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    fontSize: `calc(${length > 5 ? 0.2 - (length / 100) : 0.2} * 100vh)`,
    lineHeight: `calc(${length > 5 ? 0.2 - (length / 100) : 0.2} * 100vh)`,
    right: `calc((${length > 5 ? 0.2 - (length / 100) : 0.2} * 100vh) - 36px)`,
    height: `calc(${length > 5 ? 0.2 - (length / 100) : 0.2} * 100vh)`,
}));
