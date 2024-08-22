import { AnimatePresence } from 'framer-motion';

import { EarningsContainer, EarningsWrapper } from './Earnings.styles.ts';
import formatBalance from '@app/utils/formatBalance.ts';
import { useCallback } from 'react';

import { useMiningStore } from '@app/store/useMiningStore.ts';
import CharSpinner from '@app/components/CharSpinner/CharSpinner.tsx';

const variants = {
    visible: {
        opacity: 1,
        y: 0,
        scale: 1.05,
        transition: {
            duration: 0.8,
            scale: {
                duration: 0.5,
            },
        },
    },
    hidden: {
        opacity: 0,
        y: 50,
        transition: { duration: 0.2, delay: 0.75 },
    },
};

export default function Earnings() {
    const earnings = useMiningStore((s) => s.earnings);
    const setEarnings = useMiningStore((s) => s.setEarnings);
    const formatted = formatBalance(earnings || 0);
    const handleComplete = useCallback(() => {
        setEarnings(undefined);
    }, [setEarnings]);

    return (
        <EarningsContainer>
            <AnimatePresence>
                {earnings ? (
                    <EarningsWrapper
                        initial="hidden"
                        variants={variants}
                        animate="visible"
                        exit="hidden"
                        onAnimationComplete={() => {
                            handleComplete();
                        }}
                    >
                        <span>you&apos;ve earned</span>
                        <CharSpinner value={formatted} />
                        <span>XTR</span>
                    </EarningsWrapper>
                ) : null}
            </AnimatePresence>
        </EarningsContainer>
    );
}
