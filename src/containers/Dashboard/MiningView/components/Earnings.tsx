import { AnimatePresence } from 'framer-motion';

import { EarningsContainer, EarningsWrapper, RecapText, ShinyWrapper, WinText, WinWrapper } from './Earnings.styles.ts';
import formatBalance from '@app/utils/formatBalance.ts';

import CharSpinner from '@app/components/CharSpinner/CharSpinner.tsx';
import { Trans, useTranslation } from 'react-i18next';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';

const variants = {
    visible: {
        opacity: 1,
        y: '-150%',
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
        y: '-100%',
        transition: { duration: 0.2, delay: 3, ease: 'linear' },
    },
};

export default function Earnings() {
    const { t } = useTranslation('mining-view', { useSuspense: false });

    const earnings = useBlockchainVisualisationStore((s) => s.earnings);
    const recapData = useBlockchainVisualisationStore((s) => s.recapData);

    const displayEarnings = recapData?.totalEarnings || earnings;

    const formatted = formatBalance(displayEarnings || 0, 1);

    return (
        <EarningsContainer>
            <AnimatePresence mode="wait">
                {displayEarnings ? (
                    <EarningsWrapper variants={variants} initial="hidden" animate="visible" exit="hidden">
                        {recapData?.totalEarnings ? (
                            <RecapText>
                                <Trans
                                    ns="mining-view"
                                    i18nKey={'you-won-while-away'}
                                    values={{
                                        blocks: `${recapData.count} block${recapData.count === 1 ? `` : 's'}`,
                                    }}
                                    components={{ span: <span /> }}
                                />
                            </RecapText>
                        ) : null}
                        <WinWrapper>
                            <WinText>{t('your-reward-is')}</WinText>
                            <ShinyWrapper>
                                <CharSpinner value={formatted.toString()} fontSize={76} XTMAlignment="center" />
                            </ShinyWrapper>
                        </WinWrapper>
                    </EarningsWrapper>
                ) : null}
            </AnimatePresence>
        </EarningsContainer>
    );
}
