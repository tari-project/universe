import { DisplayedTransaction } from '@app/types/app-status.ts';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';

const parseTimestampMs = (timestamp: string | number): number => {
    if (typeof timestamp === 'number') return timestamp;
    const parsed = Date.parse(timestamp);
    return Number.isNaN(parsed) ? 0 : parsed;
};

const sortTransactions = (txs: DisplayedTransaction[]): DisplayedTransaction[] => {
    if (txs.length <= 1) return txs;
    const decorated = txs.map((tx) => ({ tx, ts: parseTimestampMs(tx.blockchain.timestamp) }));
    decorated.sort((a, b) => b.ts - a.ts);
    return decorated.map((entry) => entry.tx);
};

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
    let needsResort = false;

    incomingList.forEach((newTx) => {
        const matchIndex = indexById.get(newTx.id);

        if (matchIndex !== undefined) {
            const existing = updatedList[matchIndex];

            const updatedTransaction = { ...newTx };

            if (existing.bridge_transaction_details && !updatedTransaction.bridge_transaction_details) {
                updatedTransaction.bridge_transaction_details = existing.bridge_transaction_details;
            }
            if (!deepEqual(existing, updatedTransaction)) {
                if (existing.blockchain?.timestamp !== updatedTransaction.blockchain?.timestamp) {
                    needsResort = true;
                }
                updatedList[matchIndex] = updatedTransaction;
                hasChanges = true;
            }
        } else if (upsert) {
            addedItems.push(newTx);
            hasChanges = true;
            needsResort = true;
        }
    });

    if (!hasChanges) return currentList;
    if (!needsResort) return updatedList;

    return sortTransactions([...addedItems, ...updatedList]);
};
