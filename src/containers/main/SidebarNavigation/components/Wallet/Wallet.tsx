import { useCallback, useState } from 'react';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'motion/react';

import { useWalletStore } from '@app/store/useWalletStore.ts';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

import SyncTooltip from './SyncTooltip/SyncTooltip.tsx';
import History from './History.tsx';

import {
    CornerButton,
    CornerButtonBadge,
    ScrollMask,
    SidebarCover,
    WalletContainer,
    WalletCornerButtons,
} from './Wallet.styles.ts';
import WalletBalanceMarkup from './WalletBalanceMarkup.tsx';

export default function Wallet() {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const calculated_balance = useWalletStore((s) => s.calculated_balance);
    const setShowPaperWalletModal = usePaperWalletStore((s) => s.setShowModal);
    const paperWalletEnabled = useAppConfigStore((s) => s.paper_wallet_enabled);
    const fetchCoinbaseTransactions = useWalletStore((s) => s.fetchCoinbaseTransactions);

    const rewardCount = useBlockchainVisualisationStore((s) => s.rewardCount);
    const setRewardCount = useBlockchainVisualisationStore((s) => s.setRewardCount);

    const [showHistory, setShowHistory] = useState(false);

    const handleShowClick = useCallback(
        async (e) => {
            e.stopPropagation();
            if (!showHistory) {
                await fetchCoinbaseTransactions(false, 20);
            }

            setShowHistory((c) => {
                if (!c) {
                    setRewardCount(undefined);
                }

                return !c;
            });
        },
        [fetchCoinbaseTransactions, setRewardCount, showHistory]
    );

    const handleSyncButtonClick = (e) => {
        e.stopPropagation();
        setShowPaperWalletModal(true);
    };

    const showCount = Boolean(rewardCount && rewardCount > 0 && !showHistory);
    return (
        <>
            <WalletContainer>
                <WalletCornerButtons>
                    {paperWalletEnabled && (
                        <SyncTooltip
                            trigger={
                                <CornerButton onClick={handleSyncButtonClick}>{t('paper-wallet-button')}</CornerButton>
                            }
                            title={t('paper-wallet-tooltip-title')}
                            text={t('paper-wallet-tooltip-message')}
                        />
                    )}
                    {/* TODO: User might have spent his rewards */}
                    {calculated_balance ? (
                        <CornerButton onClick={handleShowClick} $hasReward={showCount}>
                            {showCount && (
                                <CornerButtonBadge>
                                    <span>{rewardCount}</span>
                                </CornerButtonBadge>
                            )}
                            {!showHistory ? t('rewards') : t('hide-history')}
                        </CornerButton>
                    ) : null}
                </WalletCornerButtons>

                <WalletBalanceMarkup />

                <AnimatePresence mode="wait">
                    {showHistory ? (
                        <>
                            <History />
                            <ScrollMask initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                        </>
                    ) : null}
                </AnimatePresence>
            </WalletContainer>

            <AnimatePresence>
                {showHistory && (
                    <SidebarCover
                        onClick={handleShowClick}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
