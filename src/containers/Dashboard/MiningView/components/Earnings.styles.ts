import { styled } from '@mui/system';
import { Typography } from '@mui/material';
import { motion } from 'framer-motion';
export const EarningsContainer = styled('div')`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    height: 60%;
`;

export const EarningsText = styled(Typography)`
    font-family: 'DrukWideLCGBold', sans-serif;
    font-size: 60px;
    line-height: 1.1;
`;

export const EarningsWrapper = styled(motion.div)`
    font-family: 'DrukWideLCGBold', sans-serif;
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    gap: 10px;
`;
