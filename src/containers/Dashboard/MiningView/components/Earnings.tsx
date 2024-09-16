import { AnimatePresence } from 'framer-motion';

import { EarningsContainer, EarningsWrapper } from './Earnings.styles.ts';
import formatBalance from '@app/utils/formatBalance.ts';
import { useCallback } from 'react';

import { useMiningStore } from '@app/store/useMiningStore.ts';
import CharSpinner from '@app/components/CharSpinner/CharSpinner.tsx';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

const variants = {
    visible: {
        opacity: 1,
        y: -220,
        scale: 1.05,
        transition: {
            duration: 1.25,
            ease: 'linear',
            scale: {
                duration: 0.9,
            },
        },
    },
    hidden: {
        opacity: 0.2,
        y: -180,
        transition: { duration: 0.2, delay: 3, ease: 'linear' },
    },
};

export default function Earnings() {
    const { t } = useTranslation('mining-view', { useSuspense: false });

    const { earnings, setPostBlockAnimation, setEarnings, setTimerPaused } = useMiningStore(
        useShallow((s) => ({
            setPostBlockAnimation: s.setPostBlockAnimation,
            setEarnings: s.setEarnings,
            setTimerPaused: s.setTimerPaused,
            earnings: s.earnings,
        }))
    );
    const formatted = formatBalance(earnings || 0);

    const handleComplete = useCallback(() => {
        const winTimeout = setTimeout(() => {
            setPostBlockAnimation(true);
            setTimerPaused(false);
            setEarnings(undefined);
        }, 3000);

        return () => {
            clearTimeout(winTimeout);
        };
    }, [setEarnings, setPostBlockAnimation, setTimerPaused]);

    return (
        <EarningsContainer>
            <AnimatePresence mode="wait">
                {earnings ? (
                    <EarningsWrapper
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onAnimationComplete={() => {
                            handleComplete();
                        }}
                    >
                        <span>{t('your-reward-is')}</span>
                        <CharSpinner value={formatted.toString()} fontSize={72} />
                    </EarningsWrapper>
                ) : null}
            </AnimatePresence>
        </EarningsContainer>
    );
}
