import { Circle, ContentWrapper, GemAmount, Wrapper } from './EarningsAnimation.styles.ts';
import { Transition, Variants } from 'framer-motion';
import gemImage from '@app/assets/images/gem.png';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';

import { formatNumber } from '@app/utils/formatNumber.ts';
const circles = [82, 144, 210, 272, 316];

const transition: Transition = {
    duration: 2,
    delay: 0.2,
    ease: 'linear',
    staggerChildren: 0.01,
};

const variants: Variants = {
    initial: ({ current }) => ({
        x: 158 - current / 2,
        y: 104 - current / 2,
        width: current,
        height: current,
        opacity: 0,
    }),
    animate: ({ i, next }) => ({
        width: next,
        height: next,
        x: 158 - next / 2,
        y: 104 - next / 2,
        opacity: i === 4 ? 0 : 1,
    }),
};

export default function EarningsAnimation({
    gemValue,
    onAnimationComplete,
}: {
    gemValue: number;
    onAnimationComplete: () => void;
}) {
    const formatted = formatNumber(gemValue || 0, 2);
    return (
        <Wrapper
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 2 } }}
            transition={{ duration: 0.2 }}
            onAnimationComplete={onAnimationComplete}
            style={{
                height: 208,
            }}
        >
            <ContentWrapper>
                <div />
                <Stack direction="column" alignItems="center">
                    <GemAmount>
                        <img src={gemImage} alt="gem" />
                        <Typography>{formatted}</Typography>
                    </GemAmount>

                    <Typography variant="p">Bonus Gems earned</Typography>
                </Stack>
                <Typography variant="p">Keep mining to earn more rewards!</Typography>
            </ContentWrapper>
            {circles.map((current, i) => {
                const nextIndex = i < 4 ? i + 1 : 0;
                const next = circles[nextIndex];
                return (
                    <Circle
                        key={current + i}
                        transition={transition}
                        style={{ zIndex: i }}
                        variants={variants}
                        initial="initial"
                        animate="animate"
                        custom={{ i, current, next }}
                    />
                );
            })}
        </Wrapper>
    );
}
