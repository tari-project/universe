import i18n from 'i18next';

import { TransactionDirection, TransactionStatus } from '@app/types/transactions.ts';
import { TransationType } from '@app/components/transactions/types.ts';
import { TransactionInfo } from '@app/types/app-status.ts';
import { UserTransactionDTO } from '@tari-project/wxtm-bridge-backend-api';
import { useWalletStore } from '@app/store';
import { formatNumber, FormatPreset } from './formatters';

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

export function getTxTypeByStatus(transaction: TransactionInfo): TransationType {
    if (txTypes.mined.includes(transaction.status)) {
        return 'mined';
    }
    if (txTypes.oneSided.includes(transaction.status)) {
        return transaction.direction === TransactionDirection.Inbound ? 'received' : 'sent';
    }
    return 'unknown';
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
    const typeTitle =
        itemType === 'unknown' ? TransactionDirection[transaction.direction] : i18n.t(`common:${itemType}`);

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

export function convertBridgeTransactionsToTransactions(bridgeTransactions: UserTransactionDTO[]): TransactionInfo[] {
    const sourceAddress = useWalletStore.getState().tari_address_base58;
    return bridgeTransactions.map((transaction, index) => ({
        tx_id: index,
        amount: Number(transaction.feeAmount),
        mined_in_block_height: 0,
        direction: 0,
        status:
            transaction.status === UserTransactionDTO.status.SUCCESS
                ? TransactionStatus.Completed
                : TransactionStatus.Pending,
        timestamp: 0,
        source_address: sourceAddress,
        dest_address: transaction.destinationAddress,
        payment_id: '',
        fee: Number(transaction.feeAmount),
        excess_sig: '',
        is_cancelled: false,
        message: '',
    }));
}
