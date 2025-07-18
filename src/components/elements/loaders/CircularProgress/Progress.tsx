import * as m from 'motion/react-m';
import styled from 'styled-components';

interface ProgressProps {
    percentage?: number;
}

const Wrapper = styled.div`
    margin: auto;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.palette.success.main};
    svg {
        display: flex;
        width: 100%;
        height: auto;
    }
`;
export function Progress({ percentage = 0 }: ProgressProps) {
    console.debug(`percentage= `, percentage);
    return (
        <Wrapper>
            <m.svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <m.circle cx="14" cy="14" r="12" stroke="white" strokeWidth="3.84" opacity={0.3} />
                <m.circle
                    cx="14"
                    cy="14"
                    r="12"
                    strokeLinecap="round"
                    strokeLinejoin="bevel"
                    stroke="white"
                    strokeWidth="3.84"
                    style={{ rotate: -90 }}
                    animate={{ pathLength: percentage / 100 }}
                />
            </m.svg>
        </Wrapper>
    );
}
