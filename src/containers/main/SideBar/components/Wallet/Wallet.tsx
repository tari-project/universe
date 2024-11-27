import { useCallback, useState, useEffect } from 'react';
import { useBlockchainVisualisationStore } from '@app/store/useBlockchainVisualisationStore';
import CharSpinner from '@app/components/CharSpinner/CharSpinner.tsx';
import {
    BalanceVisibilityButton,
    CornerButton,
    CornerButtonBadge,
    ScrollMask,
    SidebarCover,
    WalletBalance,
    WalletBalanceContainer,
    WalletBalanceWrapper,
    WalletContainer,
    WalletCornerButtons,
} from './Wallet.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { AnimatePresence } from 'framer-motion';
import History from './History.tsx';
import useFetchTx from '@app/hooks/mining/useTransactions.ts';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore.ts';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import SyncTooltip from './SyncTooltip/SyncTooltip.tsx';
import { formatNumber, FormatPreset } from '@app/utils/formatters.ts';

export default function Wallet() {
    const { t } = useTranslation('sidebar', { useSuspense: false });

    const balance = useWalletStore((s) => s.balance);
    const transactions = useWalletStore((s) => s.transactions);
    const isTransactionLoading = useWalletStore((s) => s.isTransactionLoading);
    const setShowPaperWalletModal = usePaperWalletStore((s) => s.setShowModal);
    const paperWalletEnabled = useAppConfigStore((s) => s.paper_wallet_enabled);

    const recapCount = useBlockchainVisualisationStore((s) => s.recapCount);
    const setRecapCount = useBlockchainVisualisationStore((s) => s.setRecapCount);

    const [showBalance, setShowBalance] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [showLongBalance, setShowLongBalance] = useState(false);
    const [animateNumbers, setShowAnimateNumbers] = useState(true);

    const fetchTx = useFetchTx();
    const formatted = formatNumber(balance || 0, FormatPreset.TXTM_COMPACT);
    const formattedLong = formatNumber(balance || 0, FormatPreset.TXTM_LONG);

    const sizingLong = useCallback(() => {
        const baseSize = 50;
        const step = 1.75;
        const maxLength = 20;
        const length = Math.min(formattedLong.length, maxLength);
        if (length <= 9) return baseSize;
        return baseSize - (length - 6) * step;
    }, [formattedLong.length]);

    const toggleBalanceVisibility = () => setShowBalance((prev) => !prev);
    const displayValue = balance === null ? '-' : showBalance ? formatted : '*****';

    const handleShowClick = useCallback(() => {
        if (balance && !transactions.length && !isTransactionLoading) {
            fetchTx().then(() => setShowHistory((c) => !c));
            return;
        }

        setRecapCount(undefined);

        setShowHistory((c) => !c);
    }, [balance, fetchTx, isTransactionLoading, setRecapCount, transactions?.length]);

    const handleSyncButtonClick = () => {
        setShowPaperWalletModal(true);
    };

    const handleMouseOver = () => {
        setShowAnimateNumbers(false);
        setShowLongBalance(true);
    };

    const handleMouseOut = () => {
        setShowAnimateNumbers(false);
        setShowLongBalance(false);
    };

    useEffect(() => {
        if (!animateNumbers) {
            const timer = setTimeout(() => {
                setShowAnimateNumbers(true);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [animateNumbers]);

    const balanceMarkup = (
        <WalletBalanceContainer onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
            <Stack direction="row" alignItems="center">
                <Typography variant="span" style={{ fontSize: '15px' }}>
                    {t('wallet-balance')}
                </Typography>
                <BalanceVisibilityButton onClick={toggleBalanceVisibility}>
                    {showBalance ? (
                        <IoEyeOffOutline size={14} color="white" />
                    ) : (
                        <IoEyeOutline size={14} color="white" />
                    )}
                </BalanceVisibilityButton>
            </Stack>
            <WalletBalanceWrapper>
                <AnimatePresence mode="popLayout">
                    {!showLongBalance || !showBalance ? (
                        <WalletBalance
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key="compressed-number"
                        >
                            <CharSpinner
                                value={displayValue}
                                variant="simple"
                                fontSize={50}
                                animateNumbers={animateNumbers}
                            />
                        </WalletBalance>
                    ) : (
                        <WalletBalance
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key="full-number"
                        >
                            <CharSpinner
                                value={formattedLong}
                                variant="simple"
                                fontSize={sizingLong()}
                                animateNumbers={animateNumbers}
                            />
                        </WalletBalance>
                    )}
                </AnimatePresence>
            </WalletBalanceWrapper>
        </WalletBalanceContainer>
    );

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

                {balanceMarkup}

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
