import { AnimatePresence } from 'framer-motion';

import { EarningsContainer, EarningsWrapper } from './Earnings.styles.ts';
import formatBalance from '@app/utils/formatBalance.ts';

import CharSpinner from '@app/components/CharSpinner/CharSpinner.tsx';
import { useTranslation } from 'react-i18next';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';

const variants = {
    visible: {
        opacity: 1,
        y: -190,
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
        y: -160,
        transition: { duration: 0.2, delay: 3, ease: 'linear' },
    },
};

export default function Earnings() {
    const { t } = useTranslation('mining-view', { useSuspense: false });

    const earnings = useBlockchainVisualisationStore((s) => s.earnings);
    const formatted = formatBalance(earnings || 0);

    return (
        <EarningsContainer>
            <AnimatePresence mode="wait">
                {earnings ? (
                    <EarningsWrapper variants={variants} initial="hidden" animate="visible" exit="hidden">
                        <span>{t('your-reward-is')}</span>
                        <CharSpinner value={formatted.toString()} fontSize={72} />
                    </EarningsWrapper>
                ) : null}
            </AnimatePresence>
        </EarningsContainer>
    );
}
