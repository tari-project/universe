import { BackendBridgeTransaction, CombinedBridgeWalletTransaction, useConfigUIStore } from '@app/store';
import { TransactionInfo } from '@app/types/app-status';

function formatTimeStamp(timestamp: number): string {
    const appLanguage = useConfigUIStore.getState().application_language;
    const systemLang = useConfigUIStore.getState().should_always_use_system_language;
    return new Date(timestamp * 1000)?.toLocaleString(systemLang ? undefined : appLanguage, {
        month: 'short',
        day: '2-digit',
        hourCycle: 'h23',
        hour: 'numeric',
        minute: 'numeric',
    });
}

function formatBridgeDateToTimestamp(date: string): number {
    //2025-05-28T08:53:02.859Z
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date format');
    }
    return Math.floor(dateObj.getTime() / 1000); // Convert to seconds
}

function convertWalletTransactionToCombinedTransaction(transaction: TransactionInfo): CombinedBridgeWalletTransaction {
    return {
        sourceAddress: transaction.source_address,
        destinationAddress: transaction.dest_address,
        paymentId: transaction.payment_id,
        feeAmount: transaction.fee,
        createdAt: transaction.timestamp,
        tokenAmount: transaction.amount,
        mined_in_block_height: transaction.mined_in_block_height,
        walletTransactionDetails: {
            txId: transaction.tx_id,
            direction: transaction.direction,
            isCancelled: transaction.is_cancelled,
            status: transaction.status,
            excessSig: transaction.excess_sig,
            message: transaction.message,
            paymentReference: transaction.payment_reference,
        },
        bridgeTransactionDetails: undefined,
    };
}

function getTimestampFromTransaction(transaction: TransactionInfo | BackendBridgeTransaction): number {
    if (isTransactionInfo(transaction)) {
        return transaction.timestamp;
    } else if (isBridgeTransaction(transaction)) {
        return formatBridgeDateToTimestamp(transaction.createdAt);
    }
    throw new Error('Invalid transaction type');
}

function findFirstNonBridgeTransaction(
    transactions: (TransactionInfo | BackendBridgeTransaction)[]
): TransactionInfo | undefined {
    return transactions.find((tx) => 'direction' in tx && tx.direction !== undefined) as TransactionInfo | undefined;
}

function findByTransactionId(
    transactions: (TransactionInfo | BackendBridgeTransaction)[],
    txId: number | undefined
): TransactionInfo | undefined {
    return transactions.find((tx) => 'tx_id' in tx && tx.tx_id === txId) as TransactionInfo | undefined;
}

function isBridgeTransaction(
    transaction: TransactionInfo | BackendBridgeTransaction
): transaction is BackendBridgeTransaction {
    return 'tokenAmount' in transaction && typeof transaction.tokenAmount === 'string';
}

function isTransactionInfo(transaction: TransactionInfo | BackendBridgeTransaction): transaction is TransactionInfo {
    return 'tx_id' in transaction && typeof transaction.tx_id === 'string';
}

export {
    formatTimeStamp,
    findFirstNonBridgeTransaction,
    findByTransactionId,
    isBridgeTransaction,
    isTransactionInfo,
    getTimestampFromTransaction,
    convertWalletTransactionToCombinedTransaction,
};
