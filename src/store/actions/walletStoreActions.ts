import { invoke } from '@tauri-apps/api/core';
import { WalletTransaction, WalletBalance } from '@app/types/app-status.ts';
import { useWalletStore } from '../useWalletStore';
import { setError } from './appStateStoreActions';
import { TxHistoryFilter } from '@app/components/transactions/history/FilterSelect';

import { TariAddressUpdatePayload } from '@app/types/events-payloads';
import { addToast } from '@app/components/ToastStack/useToastStore';
import { t } from 'i18next';
import { startMining, stopMining } from './miningStoreActions';
import { useMiningStore } from '../useMiningStore';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';
import { queryClient } from '@app/App/queryClient.ts';
import { KEY_EXPLORER } from '@app/hooks/mining/useFetchExplorerData.ts';
import { useMiningPoolsStore } from '@app/store/useMiningPoolsStore.ts';
import { fetchBridgeTransactionsHistory } from './bridgeApiActions';

// NOTE: Tx status differ for core and proto(grpc)
export const COINBASE_BITFLAG = 6144;
export const NON_COINBASE_BITFLAG = 2015;

export interface TxArgs {
    filter?: TxHistoryFilter;
    offset?: number;
    limit?: number;
}

export const importSeedWords = async (seedWords: string[]) => {
    useWalletStore.setState((c) => ({
        ...c,
        is_wallet_importing: true,
        tx_history: [],
        bridge_transactions: [],
        wallet_scanning: {
            is_initial_scan_finished: false,
            scanned_height: 0,
            total_height: 0,
            progress: 0,
        },
    }));

    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;

    try {
        if (anyMiningInitiated) {
            await stopMining();
        }
        await invoke('import_seed_words', { seedWords }).then(() => {
            const initialPoolStats = useMiningPoolsStore.getInitialState();
            useMiningPoolsStore.setState({ ...initialPoolStats });
        });

        useWalletStore.setState((c) => ({ ...c, is_wallet_importing: false }));
        addToast({
            title: t('success', { ns: 'airdrop' }),
            text: t('import-seed-success', { ns: 'settings' }),
            type: 'success',
        });
        if (anyMiningInitiated) {
            await startMining();
        }
    } catch (error) {
        const errorMessage = error as unknown as string;
        if (!errorMessage.includes('User canceled the operation') && !errorMessage.includes('PIN entry cancelled')) {
            setError(`Could not import seed words: ${error}`, true);
        }
        useWalletStore.setState((c) => ({ ...c, is_wallet_importing: false }));
    } finally {
        useWalletStore.setState((c) => ({ ...c, is_wallet_importing: false }));
    }
};

export const setExternalTariAddress = async (newAddress: string) => {
    await invoke('set_external_tari_address', { address: newAddress })
        .then(() => {
            console.info('New Tari address set successfully to:', newAddress);
        })
        .catch((e) => {
            console.error('Could not set external tari address', e);
            setError('Could not change external tari address');
        });
};

export const setWalletBalance = async (balance: WalletBalance) => {
    const currentBalance = useWalletStore.getState().balance;
    const isEqual = deepEqual(currentBalance, balance);

    if (isEqual) return;

    useWalletStore.setState({ balance });

    const calculated_balance =
        balance.available_balance + balance.timelocked_balance + balance.pending_incoming_balance;

    useWalletStore.setState({ calculated_balance });
    await queryClient.invalidateQueries({ queryKey: [KEY_EXPLORER] });
};

export const setIsSwapping = (isSwapping: boolean) => {
    useWalletStore.setState((c) => ({ ...c, is_swapping: isSwapping }));
};
export const setIsWalletLoading = (isLoading: boolean) => {
    useWalletStore.setState((c) => ({ ...c, isLoading }));
};

export const setTxHistoryFilter = (filter: TxHistoryFilter) => {
    useWalletStore.setState((c) => ({ ...c, transaction_history_filter: filter }));
};

export const setDetailsItemTransaction = (detailsItemTransaction: WalletTransaction | null) =>
    useWalletStore.setState((c) => ({ ...c, selectedTransactionDetails: detailsItemTransaction }));

export const handleSelectedTariAddressChange = (payload: TariAddressUpdatePayload) => {
    const { tari_address_base58, tari_address_emoji, tari_address_type } = payload;
    useWalletStore.setState((c) => ({
        ...c,
        is_wallet_importing: useWalletStore.getState().is_wallet_importing,
        tari_address_base58,
        tari_address_emoji,
        tari_address_type,
    }));
};

export const setExchangeETHAdress = (ethAddress: string, exchangeId: string) => {
    const newEntry = { [exchangeId]: ethAddress };

    useWalletStore.setState((c) => ({
        ...c,
        exchange_wxtm_addresses: {
            ...c.exchange_wxtm_addresses,
            ...newEntry,
        },
    }));
};

export const handlePinLocked = (is_pin_locked: boolean) => {
    useWalletStore.setState((c) => ({
        ...c,
        is_pin_locked,
    }));
};

export const handleSeedBackedUp = (is_seed_backed_up: boolean) => {
    useWalletStore.setState((c) => ({
        ...c,
        is_seed_backed_up,
    }));
};

function shouldFetchBridgeItems(incomingWalletTransactions: WalletTransaction[]): boolean {
    const bridgeWalletTransactions = useWalletStore.getState().bridge_transactions;
    const coldWalletAddress = useWalletStore.getState().cold_wallet_address;

    const isThereANewBridgeTransaction = incomingWalletTransactions.some(
        (tx) =>
            tx.operations.some((op) => op.claimed_recipient_address === coldWalletAddress) &&
            !bridgeWalletTransactions?.some(
                (bridgeTx) =>
                    bridgeTx.paymentId === tx.memo_parsed && Number(bridgeTx.tokenAmount) === tx.transaction_balance
            )
    );

    return isThereANewBridgeTransaction;
}

const solveBridgeTransactionDetails = async (walletTxs: WalletTransaction[]): Promise<void> => {
    if (shouldFetchBridgeItems(walletTxs)) {
        const walletAddress = useWalletStore((state) => state.tari_address_base58);
        const bridgeTransactions = await fetchBridgeTransactionsHistory(walletAddress);
        bridgeTransactions.forEach((bridgeTx) => {
            walletTxs.map((walletTx) => {
                if (
                    bridgeTx.paymentId === walletTx.memo_parsed ||
                    (Number(bridgeTx.tokenAmount) === walletTx.transaction_balance &&
                        bridgeTx.destinationAddress === useWalletStore.getState().cold_wallet_address)
                ) {
                    return {
                        ...walletTx,
                        bridge_transaction_details: {
                            status: bridgeTx.status,
                            transactionHash: bridgeTx.transactionHash,
                        },
                    };
                }
                return walletTx;
            });
        });
    }
};

export const handleWalletTransactionsFound = async (payload: WalletTransaction[]) => {
    const currentTransactions = useWalletStore.getState().wallet_transactions;
    const copiedCurrentTransactions = [...currentTransactions];
    const filteredIncomingTransactions = payload.filter((newTx) => {
        return !copiedCurrentTransactions.some((existingTx) => existingTx.id === newTx.id);
    });

    await solveBridgeTransactionDetails(filteredIncomingTransactions);

    const mergedTransactions = filteredIncomingTransactions.concat(copiedCurrentTransactions);
    useWalletStore.setState((c) => ({
        ...c,
        wallet_transactions: mergedTransactions,
    }));
};

export const handleWalletTransactionUpdated = (payload: WalletTransaction) => {
    const currentTransactions = useWalletStore.getState().wallet_transactions;
    const transactionIndex = currentTransactions.findIndex((tx) => tx.id === payload.id);

    let transactionToUpdate = currentTransactions.find((tx) => tx.id === payload.id);
    if (transactionToUpdate) {
        transactionToUpdate = payload;
        const updatedTransactions = [...currentTransactions];
        updatedTransactions[transactionIndex] = transactionToUpdate;
        useWalletStore.setState((c) => ({
            ...c,
            wallet_transactions: updatedTransactions,
        }));
    }
};

export const handleWalletTransactionsCleared = () => {
    useWalletStore.setState((c) => ({
        ...c,
        wallet_transactions: [],
    }));
};
