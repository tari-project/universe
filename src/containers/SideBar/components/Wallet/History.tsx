import { HistoryContainer } from '@app/containers/SideBar/components/Wallet/Wallet.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import HistoryItem from '@app/containers/SideBar/components/Wallet/HistoryItem.tsx';
import { useWalletStore } from '@app/store/useWalletStore';
import { useEffect } from 'react';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { useTranslation } from 'react-i18next';

const container = {
    hidden: { opacity: 0, height: 0 },
    visible: {
        opacity: 1,
        height: 326,
    },
};

export default function History() {
    const isTransactionLoading = useWalletStore((s) => s.isTransactionLoading);
    const transactions = useWalletStore((s) => s.transactions);
    const fetchTransactionHistory = useWalletStore((s) => s.fetchTransactionHistory);
    const { t } = useTranslation('sidebar', { useSuspense: false });

    useEffect(() => {
        fetchTransactionHistory();
    }, [fetchTransactionHistory]);

    return (
        <HistoryContainer initial="hidden" animate="visible" exit="hidden" variants={container}>
            <Typography variant="h6">{t('recent-wins')}</Typography>
            {isTransactionLoading ? (
                <CircularProgress />
            ) : (
                transactions.map((tx) => <HistoryItem key={tx.tx_id} item={tx} />)
            )}
        </HistoryContainer>
    );
}
