import i18n from 'i18next';

import { TransactionDirection, TransactionStatus } from '@app/types/transactions.ts';
import { TransationType } from '@app/components/transactions/types.ts';
import { TransactionInfo } from '@app/types/app-status.ts';

const txTypes = {
    oneSided: [TransactionStatus.OneSidedConfirmed, TransactionStatus.OneSidedUnconfirmed],
    mined: [
        TransactionStatus.MinedConfirmed,
        TransactionStatus.MinedUnconfirmed,
        TransactionStatus.CoinbaseConfirmed,
        TransactionStatus.CoinbaseUnconfirmed,
    ],
};

const txStates = {
    pending: [
        TransactionStatus.Completed,
        TransactionStatus.Pending,
        TransactionStatus.Broadcast,
        TransactionStatus.Coinbase,
        TransactionStatus.Queued,
    ],
    complete: [TransactionStatus.Imported, ...txTypes.mined],
    failed: [TransactionStatus.Rejected, TransactionStatus.NotFound],
};

export function getTxStatusString(statusNumber: number): string {
    const keyNamesOnly = Object.keys(TransactionStatus).filter((key) => isNaN(Number(key)));
    return keyNamesOnly[statusNumber];
}

export function getTxTypeByStatus(transaction: TransactionInfo): TransationType {
    if (txTypes.oneSided.includes(transaction.status)) {
        return transaction.direction === TransactionDirection.Inbound ? 'received' : 'sent';
    }
    return txTypes.mined.includes(transaction.status) ? 'mined' : 'unknown';
}

export function getTxTitle(transaction: TransactionInfo): string {
    const itemType = getTxTypeByStatus(transaction);
    const txTranslationKey = Object.entries(txStates).find(([key, value]) => {
        if (value.includes(transaction.status)) {
            return key;
        }
    });

    const txMessage = transaction.payment_id;
    if (itemType === 'mined' && transaction.mined_in_block_height) {
        return `${i18n.t('sidebar:block')} #${transaction.mined_in_block_height}`;
    }

    if (txMessage && !txMessage.includes('<No message>')) {
        return txMessage;
    }

    return i18n.t(`common:${txTranslationKey || itemType}`);
}
