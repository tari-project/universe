import { styled } from '@mui/system';
import { motion } from 'framer-motion';

export const Wrapper = styled('div')`
    display: flex;
    width: 100%;
    align-items: center;
`;

export const Characters = styled(motion.div)`
    display: flex;
    gap: 2px;
`;
export const Character = styled(motion.div)`
    display: flex;
`;
