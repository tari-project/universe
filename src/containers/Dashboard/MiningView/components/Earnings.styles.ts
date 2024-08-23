import { styled } from '@mui/system';
import { motion } from 'framer-motion';
export const EarningsContainer = styled('div')`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    position: relative;
    height: 60%;
`;

export const EarningsWrapper = styled(motion.div)`
    font-family: 'DrukWideLCGBold', sans-serif;
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    position: relative;
    gap: 10px;
`;
