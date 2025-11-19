import { useCallback, useEffect, RefObject, useState, useRef, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { VList } from 'virtua';

import { useWalletStore } from '@app/store';

import { PlaceholderItem } from './ListItem.styles.ts';
import { EmptyText, ListItemWrapper, ListWrapper } from './List.styles.ts';
import { setMinotariDetailsItem } from '@app/store/actions/walletStoreActions.ts';
import { MinotariHistoryListItem } from './minotariWallet/MinotariHistoryItem.tsx';
import { MinotariWalletTransaction, OutputType } from '@app/types/app-status.ts';

interface ListProps {
    setIsScrolled: (isScrolled: boolean) => void;
    targetRef: RefObject<HTMLDivElement> | null;
}

export function List({ setIsScrolled, targetRef }: ListProps) {
    console.log('Rendering Minotari Wallet Transaction List');

    const { t } = useTranslation('wallet');
    const walletScanning = useWalletStore((s) => s.wallet_scanning);
    const minotariWalletTransactions = useWalletStore((s) => s.minotari_wallet_transactions);
    const transactionsFilter = useWalletStore((s) => s.tx_history_filter);

    const walletTransactions = useMemo(() => {
        if (!minotariWalletTransactions) return [];

        switch (transactionsFilter) {
            case 'all-activity':
                return minotariWalletTransactions;
            case 'rewards':
                return minotariWalletTransactions.filter((tx) =>
                    tx.operations.some((op) => op.recieved_output_details?.output_type === OutputType.Coinbase)
                );
            case 'transactions':
                return minotariWalletTransactions.filter((tx) =>
                    tx.operations.every((op) => op.recieved_output_details?.output_type !== OutputType.Coinbase)
                );
            default:
                return minotariWalletTransactions;
        }
    }, [minotariWalletTransactions, transactionsFilter]);

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

    const handleMinotariDetailsChange = useCallback((transaction: MinotariWalletTransaction) => {
        setMinotariDetailsItem(transaction);
    }, []);

    // Calculate how many placeholder items we need to add
    const transactionsCount = walletTransactions?.length || 0;
    const placeholdersNeeded = Math.max(0, 5 - transactionsCount);

    const isEmpty = !minotariWalletTransactions?.length;
    const emptyMarkup = isEmpty ? <EmptyText>{t('empty-tx')}</EmptyText> : null;

    return (
        <ListWrapper>
            {emptyMarkup}
            <VList style={{ height: '100%', width: '100%' }}>
                <ListItemWrapper>
                    {walletTransactions?.map((tx, i) => {
                        const isNewTransaction = !seenTransactionIds.has(tx.id);
                        return (
                            <MinotariHistoryListItem
                                transaction={tx}
                                key={tx.id}
                                index={i}
                                itemIsNew={isNewTransaction}
                                setDetailsItem={handleMinotariDetailsChange}
                            />
                        );
                    })}

                    {/* fill the list with placeholders if there are less than 4 entries */}
                    {Array.from({ length: placeholdersNeeded }).map((_, index) => (
                        <PlaceholderItem key={`placeholder-${index}`} />
                    ))}

                    {/*added placeholder so the scroll can trigger fetch*/}
                    {walletScanning?.is_initial_scan_finished ? <PlaceholderItem $isLast /> : null}
                </ListItemWrapper>
            </VList>
        </ListWrapper>
    );
}
