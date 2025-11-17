import i18n from 'i18next';

import { TransactionDirection, TransactionStatus } from '@app/types/transactions.ts';
import { TransactionType } from '@app/components/transactions/types.ts';
import { UserTransactionDTO } from '@tari-project/wxtm-bridge-backend-api';
import { CombinedBridgeWalletTransaction } from '@app/store';

const txTypes = {
    oneSided: [
        TransactionStatus.OneSidedConfirmed,
        TransactionStatus.OneSidedUnconfirmed,
        TransactionStatus.MinedConfirmed,
        TransactionStatus.MinedUnconfirmed,
    ],
    mined: [TransactionStatus.CoinbaseConfirmed, TransactionStatus.CoinbaseUnconfirmed],
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
    complete: [
        TransactionStatus.Imported,
        TransactionStatus.OneSidedUnconfirmed,
        TransactionStatus.OneSidedConfirmed,
        TransactionStatus.MinedConfirmed,
        TransactionStatus.MinedUnconfirmed,
        TransactionStatus.CoinbaseConfirmed,
        TransactionStatus.CoinbaseUnconfirmed,
    ],
};

export function getTxTypeByStatus(transaction: CombinedBridgeWalletTransaction): TransactionType {
    if (txTypes.mined.includes(transaction.walletTransactionDetails.status)) {
        return 'mined';
    }
    if (txTypes.oneSided.includes(transaction.walletTransactionDetails.status)) {
        return transaction.walletTransactionDetails.direction === TransactionDirection.Inbound ? 'received' : 'sent';
    }
    return 'unknown';
}

export function getTxStatusTitleKey(transaction: CombinedBridgeWalletTransaction): string | undefined {
    if (transaction.bridgeTransactionDetails) {
        return transaction.bridgeTransactionDetails.status === UserTransactionDTO.status.SUCCESS
            ? 'complete'
            : 'pending';
    }
    return Object.keys(txStates).find((key) => {
        if (txStates[key].includes(transaction.walletTransactionDetails.status)) {
            return key;
        }
    });
}
export function getTxTitle(transaction: CombinedBridgeWalletTransaction): string {
    if (transaction.bridgeTransactionDetails) {
        return 'Bridge XTM to WXTM';
    }

    const itemType = getTxTypeByStatus(transaction);
    const txMessage = transaction.paymentId;
    const statusTitleKey = getTxStatusTitleKey(transaction);
    const statusTitle = i18n.t(`common:${statusTitleKey}`);
    const typeTitle =
        itemType === 'unknown'
            ? TransactionDirection[transaction.walletTransactionDetails.direction]
            : i18n.t(`common:${itemType}`);

    if (itemType === 'mined' && transaction.mined_in_block_height) {
        return `${i18n.t('sidebar:block')} #${transaction.mined_in_block_height}`;
    }

    if (txMessage && !txMessage.includes('<No message>')) {
        if (statusTitleKey !== 'complete') {
            return `${txMessage} | ${statusTitle}`;
        }
        return txMessage;
    }

    if (statusTitleKey !== 'complete') {
        return `${typeTitle} | ${statusTitle}`;
    }
    return i18n.t(`common:${itemType}`);
}
