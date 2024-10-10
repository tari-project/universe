import { HistoryContainer, HistoryPadding } from '@app/containers/SideBar/components/Wallet/Wallet.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import HistoryItem from '@app/containers/SideBar/components/Wallet/HistoryItem.tsx';
import { useWalletStore } from '@app/store/useWalletStore';

import { CircularProgress } from '@app/components/elements/CircularProgress';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

const container = {
    hidden: { opacity: 0, height: 0 },
    visible: {
        opacity: 1,
        height: 326,
    },
};

export default function History() {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const isTransactionLoading = useWalletStore((s) => s.isTransactionLoading);
    const transactions = useWalletStore((s) => s.transactions);
    const txMarkup = useMemo(() => transactions.map((tx) => <HistoryItem key={tx.tx_id} item={tx} />), [transactions]);

    return (
        <HistoryContainer initial="hidden" animate="visible" exit="hidden" variants={container}>
            <HistoryPadding>
                <Typography variant="h6">{t('recent-wins')}</Typography>
                {isTransactionLoading && !transactions?.length ? <CircularProgress /> : txMarkup}
            </HistoryPadding>
        </HistoryContainer>
    );
}
