import { styled } from '@mui/system';
import { motion } from 'framer-motion';
export const EarningsContainer = styled('div')`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    position: relative;
`;

export const EarningsWrapper = styled(motion.div)`
    display: flex;
    align-items: flex-end;
    flex-direction: row;
    justify-content: center;
    span {
        display: flex;
        font-family: 'DrukWideLCGBold', sans-serif;
        font-size: 14px;
        letter-spacing: -0.1px;
    }

    @media (max-width: 920px) {
        flex-direction: column;
        align-items: center;
    }
`;
