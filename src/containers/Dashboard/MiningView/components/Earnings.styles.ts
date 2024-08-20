import { styled } from '@mui/system';
import { motion } from 'framer-motion';
import { Typography } from '@mui/material';

export const EarningsContainer = styled('div')`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    height: 60%;
`;

export const EarningsText = styled(motion(Typography))`
    font-family: 'DrukWideLCGBold', sans-serif;
    font-size: 60px;
    line-height: 1.1;
`;
