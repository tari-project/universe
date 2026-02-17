import { DisplayedTransaction } from '@app/types/app-status.ts';

const isTransactionMatch = (txA: DisplayedTransaction, txB: DisplayedTransaction) => {
    if (txA.id === txB.id) return true;

    const inputsA = txA.details?.inputs;
    const inputsB = txB.details?.inputs;

    const matchedInputA = inputsA?.find((input) => input.is_matched && input.matched_output_id);

    const hasMatch =
        matchedInputA &&
        inputsB?.find((input) => input.is_matched && input.matched_output_id === matchedInputA.matched_output_id);

    return !!hasMatch;
};

export const mergeTransactions = (
    currentList: DisplayedTransaction[],
    incomingList: DisplayedTransaction[],
    upsert: boolean // true = Add if new, false = Only update if exists
): DisplayedTransaction[] => {
    const updatedList = [...currentList];

    const addedItems: DisplayedTransaction[] = [];
    let hasChanges = false;

    incomingList.forEach((newTx) => {
        const matchIndex = updatedList.findIndex((existingTx) => isTransactionMatch(existingTx, newTx));

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

    return [...addedItems, ...updatedList];
};
