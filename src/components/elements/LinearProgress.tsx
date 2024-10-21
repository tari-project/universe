import { m } from 'framer-motion';
import styled from 'styled-components';

const Wrapper = styled.div`
    width: 100%;
    background: ${({ theme }) => theme.palette.base};
    height: 20px;
    border-radius: 20px;
    overflow: hidden;
    align-items: center;
    display: flex;
    padding: 5px;
`;

const Bar = styled(m.div)`
    border-radius: 20px;
    background: ${({ theme }) => theme.palette.contrast};
    height: 10px;
`;

export function LinearProgress({ value = 10 }: { value?: number }) {
    return (
        <Wrapper>
            <Bar initial={{ width: 0 }} animate={{ width: `${value}%` }} />
        </Wrapper>
    );
}
