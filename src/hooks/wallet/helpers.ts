import { TransactionInfo } from '@app/types/app-status.ts';
import { BackendBridgeTransaction, CombinedBridgeWalletTransaction, useWalletStore } from '@app/store';
import { TariAddressType } from '@app/types/events-payloads.ts';

interface MergeTransactionsArgs {
    walletTransactions: TransactionInfo[];
    bridgeTransactions?: BackendBridgeTransaction[];
}

interface CheckTransactionsArgs {
    walletTransactions: CombinedBridgeWalletTransaction[];
    bridgeTransactions?: BackendBridgeTransaction[];
}
function convertWalletTransactionToCombinedTransaction(transaction: TransactionInfo): CombinedBridgeWalletTransaction {
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

function getBridgeItemIndex(bridgeTx: BackendBridgeTransaction, walletTxs: CombinedBridgeWalletTransaction[]) {
    if (bridgeTx.paymentId) {
        // Currently we can find the bridge transaction by paymentId
        return walletTxs.findIndex((walletTx) => walletTx.paymentId === bridgeTx.paymentId);
    }
    // Index found by paymentId should be always preferred, but if it is not found we use the deprecated method if exists
    const coldWalletAddress = useWalletStore.getState().cold_wallet_address;
    // If the bridge transaction has no paymentId, we try to find it by tokenAmount and destinationAddress which should equal the cold wallet address
    // This supports older transactions that might not have a paymentId
    return walletTxs.findIndex(
        (walletTx) =>
            walletTx.tokenAmount === Number(bridgeTx.tokenAmount) && walletTx.destinationAddress === coldWalletAddress
    );
}

export function mergeTransactionLists({
    walletTransactions,
    bridgeTransactions,
}: MergeTransactionsArgs): CombinedBridgeWalletTransaction[] {
    const mergedWalletTransactions: CombinedBridgeWalletTransaction[] = walletTransactions.map(
        convertWalletTransactionToCombinedTransaction
    );

    bridgeTransactions?.forEach((bridgeTx) => {
        const bridgeIndex = getBridgeItemIndex(bridgeTx, mergedWalletTransactions);
        // Don't process if we can't find the transaction in the wallet transactions
        if (bridgeIndex < 0) return;

        const baseTransactionDetails = mergedWalletTransactions[bridgeIndex];

        const bridgeTransactionDetails = {
            status: bridgeTx.status,
            transactionHash: bridgeTx.transactionHash,
            amountAfterFee: bridgeTx.amountAfterFee,
        };

        mergedWalletTransactions[bridgeIndex] = {
            ...baseTransactionDetails,
            bridgeTransactionDetails,
        };
    });

    return mergedWalletTransactions;
}

export function shouldRefetchBridgeItems({ walletTransactions, bridgeTransactions }: CheckTransactionsArgs): boolean {
    const coldWalletAddress = useWalletStore.getState().cold_wallet_address;
    const tariAddressType = useWalletStore.getState().tari_address_type;

    const isThereANewBridgeTransaction = !!walletTransactions.find(
        (tx) =>
            tx.destinationAddress === coldWalletAddress &&
            !bridgeTransactions?.some(
                (bridgeTx) => bridgeTx.paymentId === tx.paymentId && Number(bridgeTx.tokenAmount) === tx.tokenAmount
            )
    );

    const isThereEmptyBridgeTransactionAndFoundInWallet = !!walletTransactions.find(
        (tx) => tx.destinationAddress === coldWalletAddress && bridgeTransactions?.length === 0
    );

    return (
        tariAddressType === TariAddressType.Internal &&
        (isThereANewBridgeTransaction || isThereEmptyBridgeTransactionAndFoundInWallet)
    );
}
