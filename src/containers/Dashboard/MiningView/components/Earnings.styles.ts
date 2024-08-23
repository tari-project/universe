import { styled } from '@mui/system';
import { motion } from 'framer-motion';
export const EarningsContainer = styled('div')`
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const EarningsWrapper = styled(motion.div)`
    display: flex;
    align-items: flex-end;
    justify-content: center;
    span {
        font-family: 'DrukWideLCGBold', sans-serif;
        font-size: 16px;
        letter-spacing: -0.1px;
    }
`;
