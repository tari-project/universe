import * as m from 'motion/react-m';
import styled, { css, keyframes } from 'styled-components';
import { Transition } from 'motion';
import { AnimatePresence } from 'motion/react';

interface ProgressProps {
    percentage?: number;
    isInfinite?: boolean;
}

const rotate = keyframes`
0% {
    transform: rotate(0deg);
}
100% {
    transform: rotate(360deg);
}`;
const Wrapper = styled(m.div)<{ $shouldAnimate?: boolean }>`
    margin: auto;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.greyscale[50]};
    transform: rotate(-90deg);
    svg {
        display: flex;
        width: 100%;
        height: auto;
    }

    ${({ $shouldAnimate }) =>
        $shouldAnimate &&
        css`
            animation: ${rotate} 4s infinite linear;
        `}
`;

export function Progress({ percentage = 0, isInfinite = false }: ProgressProps) {
    const infinite = isInfinite || !percentage || percentage == 0;
    const transition: Transition | undefined = infinite ? { repeat: Infinity, duration: 4, ease: 'linear' } : undefined;

    const animate = !infinite
        ? { pathLength: percentage / 100, opacity: 1 }
        : {
              pathLength: [0, 0.3, 0.45, 0.8, 0.99],
              opacity: [0, 0.3, 0.45, 1, 1],
          };

    return (
        <Wrapper key={!percentage && infinite ? 'infinite' : 'progress'} $shouldAnimate={infinite}>
            <AnimatePresence>
                <m.svg
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: 'spring',
                        visualDuration: 0.25,
                        bounce: 0.35,
                        damping: 10,
                    }}
                >
                    <m.circle cx="14" cy="14" r="12" stroke="white" strokeWidth="3.84" opacity={0.3} />
                    <m.circle
                        cx="14"
                        cy="14"
                        r="12"
                        strokeLinecap="round"
                        strokeLinejoin="bevel"
                        stroke="currentcolor"
                        fill="none"
                        strokeWidth="3.84"
                        initial={{ opacity: 0, pathLength: 0 }}
                        animate={animate}
                        transition={transition}
                    />
                </m.svg>
            </AnimatePresence>
        </Wrapper>
    );
}
