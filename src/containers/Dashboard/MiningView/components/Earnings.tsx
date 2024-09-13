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
        y: -200,
        scale: 1.05,
        transition: {
            delay: 1,
            duration: 3,
            ease: 'easeInOut',
            scale: {
                duration: 1,
            },
        },
    },
    hidden: {
        opacity: 0,
        y: -150,
        transition: { duration: 1, delay: 2, ease: 'linear' },
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
                        <span>{t('your-reward-is')}</span>
                        <CharSpinner value={formatted.toString()} fontSize={72} />
                    </EarningsWrapper>
                ) : null}
            </AnimatePresence>
        </EarningsContainer>
    );
}
