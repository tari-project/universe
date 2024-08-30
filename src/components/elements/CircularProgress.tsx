import { motion } from 'framer-motion';
import styled from 'styled-components';

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.palette.success.main};
    svg {
        display: flex;
    }
`;

export function CircularProgress() {
    return (
        <Wrapper>
            <motion.svg width="40" height="40" viewBox="0 0 50 50">
                <motion.circle
                    cx="20"
                    cy="20"
                    r="10"
                    stroke="currentcolor"
                    fill="none"
                    strokeWidth={4}
                    animate={{ pathLength: [0, 0.8], rotate: [0, 180] }}
                    transition={{ repeat: Infinity, duration: 0.2 }}
                />
            </motion.svg>
        </Wrapper>
    );
}
