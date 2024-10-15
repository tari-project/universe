import { useCallback, useState } from 'react';
import formatBalance from '@app/utils/formatBalance.ts';
import CharSpinner from '@app/components/CharSpinner/CharSpinner.tsx';
import {
    BalanceVisibilityButton,
    ScrollMask,
    ShowHistoryButton,
    WalletBalance,
    WalletBalanceContainer,
    WalletContainer,
} from './Wallet.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { AnimatePresence } from 'framer-motion';
import History from './History.tsx';
import useFetchTx from '@app/hooks/mining/useTransactions.ts';

export default function Wallet() {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const balance = useWalletStore((s) => s.balance);
    const transactions = useWalletStore((s) => s.transactions);
    const isTransactionLoading = useWalletStore((s) => s.isTransactionLoading);
    const fetchTx = useFetchTx();
    const formatted = formatBalance(balance || 0);
    const sizing = formatted.length <= 6 ? 50 : formatted.length <= 8 ? 44 : 32;
    const [showBalance, setShowBalance] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    const toggleBalanceVisibility = () => setShowBalance((prev) => !prev);
    const displayValue = balance === null ? '-' : showBalance ? formatted : '*****';

    const handleShowClick = useCallback(() => {
        if (balance && !transactions.length && !isTransactionLoading) {
            fetchTx().then(() => setShowHistory((c) => !c));
            return;
        }

        setShowHistory((c) => !c);
    }, [balance, fetchTx, isTransactionLoading, transactions.length]);

    const balanceMarkup = (
        <WalletBalanceContainer>
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
            <WalletBalance>
                <CharSpinner value={displayValue} variant="simple" fontSize={sizing} />
            </WalletBalance>
        </WalletBalanceContainer>
    );

    return (
        <WalletContainer>
            {balance ? (
                <ShowHistoryButton onClick={handleShowClick} style={{ minWidth: 80 }}>
                    {!showHistory ? 'Show' : 'Hide'} history
                </ShowHistoryButton>
            ) : null}
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
    );
}
