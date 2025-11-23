import { useCallback, useEffect, useState, useRef, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { VList } from 'virtua';

import { useWalletStore } from '@app/store';

import { EmptyText, ListItemWrapper, ListWrapper } from './List.styles.ts';
import { setDetailsItemTransaction } from '@app/store/actions/walletStoreActions.ts';
import { WalletTransaction, OutputType } from '@app/types/app-status.ts';
import { HistoryListItem } from './transactionHistoryItem/HistoryItem.tsx';
import { PlaceholderItem } from './transactionHistoryItem/HistoryItem.styles.ts';

export function List() {
    const { t } = useTranslation('wallet');
    const walletScanning = useWalletStore((s) => s.wallet_scanning);
    const walletTransactionsAll = useWalletStore((s) => s.wallet_transactions);
    const transactionsFilter = useWalletStore((s) => s.transaction_history_filter);

    console.log('Rendering Transaction History List with filter:', walletTransactionsAll, transactionsFilter);

    const walletTransactions = useMemo(() => {
        if (!walletTransactionsAll) return [];

        switch (transactionsFilter) {
            case 'all-activity':
                return walletTransactionsAll;
            case 'rewards':
                return walletTransactionsAll.filter((tx) =>
                    tx.outputs.some((output) => output.output_type === OutputType.Coinbase)
                );
            case 'transactions':
                return walletTransactionsAll.filter((tx) =>
                    tx.outputs.every((output) => output.output_type !== OutputType.Coinbase)
                );
            default:
                return walletTransactionsAll;
        }
    }, [walletTransactionsAll, transactionsFilter]);

    // Track seen transaction IDs to show "new" indicator for new transactions
    const [seenTransactionIds, setSeenTransactionIds] = useState<Set<string>>(new Set());
    const isInitialLoad = useRef(true);

    // Mark all transactions as seen on initial load (so they don't show as "new")
    useEffect(() => {
        if (isInitialLoad.current && walletTransactions && walletTransactions.length > 0) {
            const initialIds = new Set(walletTransactions.map((tx) => tx.id));
            setSeenTransactionIds(initialIds);
            isInitialLoad.current = false;
        }
    }, [walletTransactions]);

    // Mark new transactions as seen after 30 seconds
    useEffect(() => {
        if (!walletTransactions || isInitialLoad.current) return;

        const newTransactionIds = walletTransactions.filter((tx) => !seenTransactionIds.has(tx.id)).map((tx) => tx.id);

        if (newTransactionIds.length === 0) return;

        const timer = setTimeout(() => {
            setSeenTransactionIds((prev) => {
                const updated = new Set(prev);
                newTransactionIds.forEach((id) => updated.add(id));
                return updated;
            });
        }, 30000); // 30 seconds

        return () => clearTimeout(timer);
    }, [walletTransactions, seenTransactionIds]);

    const handleDetailsChange = useCallback((transaction: WalletTransaction) => {
        setDetailsItemTransaction(transaction);
    }, []);

    // Calculate how many placeholder items we need to add
    const transactionsCount = walletTransactions?.length || 0;
    const placeholdersNeeded = Math.max(0, 5 - transactionsCount);

    const isEmpty = !walletTransactionsAll?.length;
    const emptyMarkup = isEmpty ? <EmptyText>{t('empty-tx')}</EmptyText> : null;

    return (
        <ListWrapper>
            {emptyMarkup}
            <VList style={{ height: '100%', width: '100%' }}>
                <ListItemWrapper>
                    {walletTransactions?.map((tx, i) => {
                        const isNewTransaction = !seenTransactionIds.has(tx.id);
                        return (
                            <HistoryListItem
                                transaction={tx}
                                key={i}
                                index={i}
                                itemIsNew={isNewTransaction}
                                setDetailsItem={handleDetailsChange}
                            />
                        );
                    })}

                    {/* fill the list with placeholders if there are less than 4 entries */}
                    {Array.from({ length: placeholdersNeeded }).map((_, index) => (
                        <PlaceholderItem key={`placeholder-${index}`} />
                    ))}

                    {/*added placeholder so the scroll can trigger fetch*/}
                    {walletScanning?.are_there_more_blocks_to_scan ? <PlaceholderItem $isLast /> : null}
                </ListItemWrapper>
            </VList>
        </ListWrapper>
    );
}
