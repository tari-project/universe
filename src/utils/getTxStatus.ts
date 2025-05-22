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
    failed: [TransactionStatus.Rejected, TransactionStatus.NotFound, TransactionStatus.CoinbaseNotInBlockChain],
    complete: [TransactionStatus.Imported, TransactionStatus.OneSidedConfirmed, ...txTypes.mined],
};

export function getTxTypeByStatus(transaction: TransactionInfo): TransationType {
    if (txTypes.oneSided.includes(transaction.status)) {
        return transaction.direction === TransactionDirection.Inbound ? 'received' : 'sent';
    }
    return txTypes.mined.includes(transaction.status) ? 'mined' : 'unknown';
}

export function getTxStatusTitleKey(transaction: TransactionInfo): string | undefined {
    return Object.keys(txStates).find((key) => {
        if (txStates[key].includes(transaction.status)) {
            return key;
        }
    });
}
export function getTxTitle(transaction: TransactionInfo): string {
    const itemType = getTxTypeByStatus(transaction);
    const txMessage = transaction.payment_id;
    const statusTitleKey = getTxStatusTitleKey(transaction);
    const statusTitle = i18n.t(`common:${statusTitleKey}`);
    const typeTitle = i18n.t(`common:${itemType}`);
    console.debug(`itemType= `, itemType);
    if (itemType === 'mined' && transaction.mined_in_block_height) {
        return `${i18n.t('sidebar:block')} #${transaction.mined_in_block_height}`;
    }

    if (txMessage && !txMessage.includes('<No message>')) {
        return txMessage;
    }
    console.debug(`statusTitleKey= `, statusTitleKey);
    if (statusTitleKey !== 'complete') {
        return `${typeTitle} | ${statusTitle}`;
    }
    return i18n.t(`common:${statusTitleKey ?? itemType}`);
}
