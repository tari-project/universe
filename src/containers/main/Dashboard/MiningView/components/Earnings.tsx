import { AnimatePresence } from 'framer-motion';

import { EarningsContainer, EarningsWrapper, RecapText, WinText, WinWrapper } from './Earnings.styles.ts';

import CharSpinner from '@app/components/CharSpinner/CharSpinner.tsx';
import { Trans, useTranslation } from 'react-i18next';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore.ts';
import { formatNumber, FormatPreset } from '@app/utils/formatters.ts';

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

    const replayItem = useBlockchainVisualisationStore((s) => s.replayItem);
    const currentItem = useBlockchainVisualisationStore((s) => s.currentItem);
    const earnings = useBlockchainVisualisationStore((s) => s.earnings);
    const recapData = useBlockchainVisualisationStore((s) => s.recapData);

    const displayEarnings = replayItem?.amount || recapData?.totalEarnings || earnings;

    const formatted = formatNumber(displayEarnings || 0, FormatPreset.TXTM_COMPACT);

    const recapText = recapData?.totalEarnings ? (
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
    ) : null;

    const replayText =
        replayItem?.amount && replayItem.mined_in_block_height ? (
            <RecapText>
                <Trans
                    ns="mining-view"
                    i18nKey={'you-won-block'}
                    values={{
                        blockHeight: replayItem.mined_in_block_height,
                    }}
                    components={{ span: <span /> }}
                />
            </RecapText>
        ) : null;

    const currentText =
        currentItem?.amount && currentItem.mined_in_block_height ? (
            <RecapText>
                <Trans
                    ns="mining-view"
                    i18nKey={'you-won-block'}
                    values={{
                        blockHeight: currentItem.mined_in_block_height,
                    }}
                    components={{ span: <span /> }}
                />
            </RecapText>
        ) : null;

    return (
        <EarningsContainer>
            <AnimatePresence mode="wait">
                {displayEarnings ? (
                    <EarningsWrapper variants={variants} initial="hidden" animate="visible" exit="hidden">
                        {currentText}
                        {replayText}
                        {recapText}
                        <WinWrapper>
                            <WinText>{t('your-reward-is')}</WinText>
                            <CharSpinner value={formatted.toString()} fontSize={76} XTMAlignment="center" />
                        </WinWrapper>
                    </EarningsWrapper>
                ) : null}
            </AnimatePresence>
        </EarningsContainer>
    );
}
