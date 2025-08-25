import { TransactionInfo } from '@app/types/app-status.ts';
import { BackendBridgeTransaction, CombinedBridgeWalletTransaction } from '@app/store';

interface MergeListArgs {
    walletTransactions: TransactionInfo[];
    bridgeTransactions?: BackendBridgeTransaction[];
    coldWalletAddress?: string;
}
export function convertWalletTransactionToCombinedTransaction(
    transaction: TransactionInfo
): CombinedBridgeWalletTransaction {
    const txDetails = {
        ...transaction,
        txId: transaction.tx_id,
        isCancelled: transaction.is_cancelled,
        excessSig: transaction.excess_sig,
        paymentReference: transaction.payment_reference,
    };
    return {
        ...transaction,
        sourceAddress: transaction.source_address,
        destinationAddress: transaction.dest_address,
        paymentId: transaction.payment_id,
        feeAmount: transaction.fee,
        createdAt: transaction.timestamp,
        tokenAmount: transaction.amount,
        walletTransactionDetails: txDetails,
        bridgeTransactionDetails: undefined,
    };
}

export function mergeTransactionLists({
    walletTransactions,
    bridgeTransactions,
    coldWalletAddress,
}: MergeListArgs): CombinedBridgeWalletTransaction[] {
    const mergedWalletTransactions: CombinedBridgeWalletTransaction[] = walletTransactions.map(
        convertWalletTransactionToCombinedTransaction
    );

    bridgeTransactions?.forEach((bridgeTx) => {
        // If the bridge transaction has no paymentId, we try to find it by tokenAmount and destinationAddress which should equal the cold wallet address
        // This supports older transactions that might not have a paymentId
        const depracatedWalletTransactionIndex = mergedWalletTransactions.findIndex(
            (tx) =>
                !bridgeTx.paymentId &&
                tx.tokenAmount === Number(bridgeTx.tokenAmount) &&
                tx.destinationAddress === coldWalletAddress
        );

        // Currently we can find the bridge transaction by paymentId
        const originalWalletBridgeTransactionIndex = mergedWalletTransactions.findIndex(
            (tx) => tx.paymentId === bridgeTx.paymentId
        );

        // Index found by paymentId should be always preferred, but if it is not found we use the deprecated method if exists
        const walletBridgeTransactionIndex =
            originalWalletBridgeTransactionIndex >= 0
                ? originalWalletBridgeTransactionIndex
                : depracatedWalletTransactionIndex;

        // Don't process if we can't find the transaction in the wallet transactions
        if (walletBridgeTransactionIndex < 0) return;

        mergedWalletTransactions[walletBridgeTransactionIndex] = {
            ...mergedWalletTransactions[walletBridgeTransactionIndex],
            bridgeTransactionDetails: {
                status: bridgeTx.status,
                transactionHash: bridgeTx.transactionHash,
                amountAfterFee: bridgeTx.amountAfterFee,
            },
        };
    });

    return mergedWalletTransactions;
}
