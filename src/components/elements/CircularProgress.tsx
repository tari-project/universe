import { m } from 'framer-motion';
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
            <m.svg width="40" height="40" viewBox="0 0 50 50">
                <m.circle
                    cx="20"
                    cy="20"
                    r="10"
                    stroke="currentcolor"
                    fill="none"
                    strokeWidth={4}
                    strokeLinecap="round"
                    animate={{ pathLength: [0, 0, 0.8, 0.95], rotate: [0, 270, 360], opacity: [0.2, 0.8, 0.9, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            </m.svg>
        </Wrapper>
    );
}
