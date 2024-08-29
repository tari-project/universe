import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

interface BlockHeightBgProps {
    length: number;
}

const topHeight = 115;
const bottomHeight = 115;

export const RulerAbsoluteWrapper = styled(Box)(() => ({
    zIndex: 100,
    position: 'absolute',
    right: 0,
    height: `calc(100vh - ${topHeight}px - ${bottomHeight}px)`,
    top: '50%',
    transform: 'translateY(-50%)',
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
    top: '50%',
    transform: 'translateY(-50%)',
    right: '15px',
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
    right: 0,
    top: "50%",
    transform: "translate(50%, calc(20px - 100%))",
    fontSize: `min(calc((100vh - ${topHeight + bottomHeight}px) / ${length}), 152px)`,
    lineHeight: 1,
    letterSpacing: '1px',
    color: `rgba(255,255,255,0.4)`,
    textTransform: 'uppercase',
    position: 'absolute',
    rotate: '270deg',
    zIndex: 1,
    transformOrigin: 'top right',
}));
