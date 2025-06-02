import {
    ethers,
    Signer as EthersSigner,
    TransactionRequest as EthersTransactionRequest,
    TransactionResponse as EthersTransactionResponse,
    TransactionReceipt as EthersTransactionReceipt,
} from 'ethers';

export enum TransactionState {
    Failed = 'Failed',
    New = 'New',
    Rejected = 'Rejected',
    Sending = 'Sending',
    Sent = 'Sent',
}

export async function sendTransactionWithWagmiSigner(
    signer: EthersSigner,
    transactionRequest: EthersTransactionRequest
): Promise<{ state: TransactionState; response?: EthersTransactionResponse; receipt?: EthersTransactionReceipt }> {
    if (!signer.provider) {
        console.error('Signer does not have a provider.');
        return { state: TransactionState.Failed };
    }

    if (transactionRequest.value) {
        try {
            transactionRequest.value = ethers.toBigInt(transactionRequest.value.toString());
        } catch (e) {
            console.error('Invalid transaction value:', transactionRequest.value, e);
            return { state: TransactionState.Failed };
        }
    }

    try {
        const txRes = await signer.sendTransaction(transactionRequest);
        const receipt = await txRes.wait(1);

        if (receipt) {
            if (receipt.status === 1) {
                return { state: TransactionState.Sent, response: txRes, receipt };
            } else {
                console.error('Transaction failed on-chain (status 0).', receipt);
                return { state: TransactionState.Failed, response: txRes, receipt };
            }
        } else {
            console.error('Transaction receipt was null after waiting.');
            return { state: TransactionState.Failed, response: txRes };
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error(`Transaction submission or mining error:`, e);
        return { state: TransactionState.Failed };
    }
}
