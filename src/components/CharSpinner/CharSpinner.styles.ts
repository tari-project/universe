import { styled } from '@mui/system';
import { motion } from 'framer-motion';

export const Wrapper = styled('div')`
    position: relative;
    overflow: hidden;
    user-select: none;
    font-variant-numeric: tabular-nums;
    height: 52px;
    display: flex;
    flex-shrink: 0;
`;

export const Characters = styled(motion.div)`
    display: flex;
    position: absolute;
    z-index: 1;
`;
export const Character = styled(motion.div)`
    display: flex;
    //width: 48px;
    height: 52px;
    flex-direction: column;
    align-items: center;

    span {
        display: flex;
        font-family: 'DrukWideLCGBold', sans-serif;
        font-size: 45px;
        line-height: 52px;
    }
`;
