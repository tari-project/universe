import { m } from 'motion';
import styled from 'styled-components';

const Wrapper = styled.div`
    max-width: 100%;
    max-height: 100%;
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
            <m.svg width="50" height="50" viewBox="0 0 40 40">
                <m.circle
                    cx="20"
                    cy="20"
                    r="10"
                    stroke="currentcolor"
                    fill="none"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="bevel"
                    opacity={0}
                    animate={{
                        pathLength: [0, 0.3, 0.8, 0.8, 0.999],
                        rotate: [0, 300, 360],
                        opacity: [null, 0.4, 0.9, 1],
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            </m.svg>
        </Wrapper>
    );
}
