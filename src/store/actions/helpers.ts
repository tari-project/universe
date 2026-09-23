import { DisplayedTransaction } from '@app/types/app-status.ts';

const sortTransactions = (txs: DisplayedTransaction[]): DisplayedTransaction[] =>
    txs.sort((a, b) => new Date(b.blockchain.timestamp).getTime() - new Date(a.blockchain.timestamp).getTime());

export const mergeTransactions = (
    currentList: DisplayedTransaction[],
    incomingList: DisplayedTransaction[],
    upsert: boolean // true = Add if new, false = Only update if exists
): DisplayedTransaction[] => {
    const updatedList = [...currentList];

    const addedItems: DisplayedTransaction[] = [];
    let hasChanges = false;

    incomingList.forEach((newTx) => {
        const matchIndex = updatedList.findIndex((existingTx) => existingTx.id === newTx.id);

        if (matchIndex >= 0) {
            const existing = updatedList[matchIndex];

            const updatedTransaction = { ...newTx };

            if (existing.bridge_transaction_details && !updatedTransaction.bridge_transaction_details) {
                updatedTransaction.bridge_transaction_details = existing.bridge_transaction_details;
            }
            updatedList[matchIndex] = updatedTransaction;

            hasChanges = true;
        } else if (upsert) {
            addedItems.push(newTx);
            hasChanges = true;
        }
    });

    if (!hasChanges) return currentList;

    return sortTransactions([...addedItems, ...updatedList]);
};
