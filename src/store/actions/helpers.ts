import { DisplayedTransaction } from '@app/types/app-status.ts';

const sortTransactions = (txs: DisplayedTransaction[]): DisplayedTransaction[] =>
    txs.sort((a, b) => new Date(b.blockchain.timestamp).getTime() - new Date(a.blockchain.timestamp).getTime());

export const mergeTransactions = (
    currentList: DisplayedTransaction[],
    incomingList: DisplayedTransaction[],
    upsert: boolean // true = Add if new, false = Only update if exists
): DisplayedTransaction[] => {
    const updatedList = [...currentList];

    // TxId is a u64 on the wire; both sides of this comparison come out of the same
    // JSON.parse, so ids past 2^53 round identically and a false match needs two ids that already
    // collided before the merge - negligible. Upgrade path: serialise TxId as a string.
    const indexById = new Map<number, number>();
    currentList.forEach((tx, index) => {
        if (!indexById.has(tx.id)) indexById.set(tx.id, index);
    });

    const addedItems: DisplayedTransaction[] = [];
    let hasChanges = false;

    incomingList.forEach((newTx) => {
        const matchIndex = indexById.get(newTx.id);

        if (matchIndex !== undefined) {
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
