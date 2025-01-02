import { useCallback, useState } from 'react';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';

import { useWalletStore } from '@app/store/useWalletStore.ts';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

import useFetchTx from '@app/hooks/mining/useTransactions.ts';
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

    const balance = useWalletStore((s) => s.balance);
    const transactions = useWalletStore((s) => s.transactions);
    const isTransactionLoading = useWalletStore((s) => s.isTransactionLoading);
    const setShowPaperWalletModal = usePaperWalletStore((s) => s.setShowModal);
    const paperWalletEnabled = useAppConfigStore((s) => s.paper_wallet_enabled);

    const recapCount = useBlockchainVisualisationStore((s) => s.recapCount);
    const setRecapCount = useBlockchainVisualisationStore((s) => s.setRecapCount);

    const [showHistory, setShowHistory] = useState(false);

    const fetchTx = useFetchTx();

    const handleShowClick = useCallback(async () => {
        if (balance && !transactions.length && !isTransactionLoading) {
            await fetchTx();
        } else {
            setRecapCount(undefined);
        }

        setShowHistory((c) => !c);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [balance, fetchTx, isTransactionLoading, transactions?.length]);

    const handleSyncButtonClick = () => {
        setShowPaperWalletModal(true);
    };

    const showCount = Boolean(recapCount && recapCount > 0 && !showHistory);

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
                    {balance ? (
                        <CornerButton onClick={handleShowClick} $hasReward={showCount}>
                            {showCount && (
                                <CornerButtonBadge>
                                    <span>{recapCount}</span>
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
