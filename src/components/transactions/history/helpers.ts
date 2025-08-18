import { CombinedBridgeWalletTransaction, useConfigUIStore } from '@app/store';
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

export { formatTimeStamp, convertWalletTransactionToCombinedTransaction };
