import { styled } from '@mui/system';
import { motion } from 'framer-motion';
export const EarningsContainer = styled('div')`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    position: relative;
    height: 60%;
    font-family: 'DrukWideLCGBold', sans-serif;
    letter-spacing: -0.2px;
`;

export const EarningsWrapper = styled(motion.div)`
    display: flex;
    align-items: flex-end;
    justify-content: center;
    position: relative;
    gap: 4px;
    span {
        font-size: 16px;
    }
`;
