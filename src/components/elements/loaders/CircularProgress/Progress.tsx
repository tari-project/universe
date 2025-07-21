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
const loadingPercentageAnimation = {
    pathLength: [0, 0.3, 0.8, 0.8, 0.999],
    rotate: [0, 300, 360],
    opacity: [null, 0.4, 0.9, 1],
};
const loadingPercentageTransition = { repeat: Infinity, duration: 2 };

export function Progress({ percentage = 0 }: ProgressProps) {
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
                    animate={percentage === 0 ? loadingPercentageAnimation : { pathLength: percentage / 100 }}
                    transition={percentage === 0 ? loadingPercentageTransition : undefined}
                />
            </m.svg>
        </Wrapper>
    );
}
