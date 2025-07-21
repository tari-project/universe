import * as m from 'motion/react-m';
import styled from 'styled-components';
import { Transition } from 'motion';

interface ProgressProps {
    percentage?: number;
    isInfinite?: boolean;
}
const Wrapper = styled(m.div)`
    margin: auto;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.greyscale[50]};
    svg {
        display: flex;
        width: 100%;
        height: auto;
    }
`;

export function Progress({ percentage = 0, isInfinite = false }: ProgressProps) {
    const infinite = isInfinite || percentage === 0;
    const transition: Transition = { repeat: Infinity, duration: 4, ease: 'linear' };

    const animate = !infinite
        ? { pathLength: percentage / 100 }
        : {
              pathLength: [null, 0.3, 0.45, 0.88, 0.89],
              opacity: [null, 0.3, 0.45, 1, 0.89],
              tiems: [0, 0.3, 0.45, 0.88, 1],
          };

    return (
        <Wrapper animate={{ rotate: 360 }} transition={{ ...transition, ease: 'anticipate' }}>
            <m.svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="12" stroke="white" strokeWidth="3.84" opacity={0.3} />
                <m.circle
                    cx="14"
                    cy="14"
                    r="12"
                    strokeLinecap="round"
                    strokeLinejoin="bevel"
                    stroke="currentcolor"
                    fill="none"
                    strokeWidth="3.84"
                    opacity={0}
                    pathLength={0}
                    animate={animate}
                    transition={transition}
                />
            </m.svg>
        </Wrapper>
    );
}
