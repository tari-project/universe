import { motion } from 'framer-motion';
import styled from 'styled-components';

const Wrapper = styled.div`
    width: 100%;
    background: ${({ theme }) => theme.palette.background.paper};
    height: 16px;
    border-radius: 20px;
    overflow: hidden;
    align-items: center;
    display: flex;
    padding: 6px;
`;

const Bar = styled(motion.div)`
    border-radius: 20px;
    background: ${({ theme }) => theme.palette.success.main};
    height: 8px;
`;

export function LinearProgress({ value = 10 }: { value?: number }) {
    return (
        <Wrapper>
            <Bar initial={{ width: 0 }} animate={{ width: `${value}%` }} />
        </Wrapper>
    );
}
