import { useTranslation } from 'react-i18next';
import { useWalletStore } from '@app/store/useWalletStore';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { FixedSizeList as List } from 'react-window';

import { ListLabel } from './HistoryItem.styles';
import { HistoryContainer, HistoryPadding } from './Wallet.styles';
import HistoryItem from './HistoryItem';
import { memo } from 'react';

const container = {
    hidden: { opacity: 0, height: 0 },
    visible: {
        opacity: 1,
        height: 326,
    },
};

const History = () => {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const isTransactionLoading = useWalletStore((s) => s.isTransactionLoading);
    const transactions = useWalletStore((s) => s.transactions);

    const Row = ({ index, style }) => (
        <div style={style}>
            <HistoryItem key={transactions[index].tx_id} item={transactions[index]} />
        </div>
    );

    return (
        <HistoryContainer initial="hidden" animate="visible" exit="hidden" variants={container}>
            <HistoryPadding>
                <ListLabel>{t('recent-wins')}</ListLabel>
                {isTransactionLoading && !transactions?.length ? (
                    <CircularProgress />
                ) : (
                    <List height={310} itemCount={transactions.length} itemSize={62} width="100%">
                        {Row}
                    </List>
                )}
            </HistoryPadding>
        </HistoryContainer>
    );
};

export default memo(History);
