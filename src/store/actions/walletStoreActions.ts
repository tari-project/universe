import { invoke } from '@tauri-apps/api/core';
import { WalletAddress, WalletBalance } from '@app/types/app-status.ts';
import { BackendBridgeTransaction, useWalletStore } from '../useWalletStore';
import { setError } from './appStateStoreActions';
import { TxHistoryFilter } from '@app/components/transactions/history/FilterSelect';
import { WrapTokenService, OpenAPI } from '@tari-project/wxtm-bridge-backend-api';
import { useConfigBEInMemoryStore } from '../useAppConfigStore';

import { setCurrentExchangeMinerId, universalExchangeMinerOption } from '@app/store/useExchangeStore.ts';
import { TransactionDetailsItem, TransactionDirection } from '@app/types/transactions';
import { useUIStore } from '../useUIStore';
import { setSeedlessUI } from './uiStoreActions';

// NOTE: Tx status differ for core and proto(grpc)
export const COINBASE_BITFLAG = 6144;
export const NON_COINBASE_BITFLAG = 2015;

export interface TxArgs {
    filter?: TxHistoryFilter;
    offset?: number;
    limit?: number;
    storeKey?: 'tx_history' | 'coinbase_transactions';
}

const filterToBitflag = (filter: TxHistoryFilter): number => {
    switch (filter) {
        case 'transactions':
            return NON_COINBASE_BITFLAG;
        case 'rewards':
            return COINBASE_BITFLAG;
        default:
            return COINBASE_BITFLAG | NON_COINBASE_BITFLAG;
    }
};

export const fetchTransactions = async ({
    offset = 0,
    limit,
    filter = 'all-activity',
    storeKey = 'tx_history',
}: TxArgs) => {
    const bitflag = filterToBitflag(filter);
    try {
        const currentTxs = useWalletStore.getState()[storeKey];
        const fetchedTxs = await invoke('get_transactions', { offset, limit, statusBitflag: bitflag });

        const updatedTxs = offset > 0 ? [...currentTxs, ...fetchedTxs] : fetchedTxs;
        useWalletStore.setState({ [storeKey]: updatedTxs });
        return updatedTxs;
    } catch (error) {
        console.error(`Could not get transaction history for ${filter}: `, error);
        return [];
    }
};

export const fetchBridgeTransactionsHistory = async () => {
    console.info('Fetching bridge transactions history...');
    const baseUrl = useConfigBEInMemoryStore.getState().bridgeBackendApiUrl;
    if (baseUrl?.includes('env var not defined')) return;
    OpenAPI.BASE = baseUrl;
    await WrapTokenService.getUserTransactions(useWalletStore.getState().tari_address_base58)
        .then((response) => {
            console.info('Bridge transactions fetched successfully:', response);
            useWalletStore.setState({
                bridge_transactions: response.transactions,
            });
        })
        .catch((error) => {
            console.error('Could not fetch bridge transactions history: ', error);
            throw new Error(`Could not fetch bridge transactions history: ${error}`);
        });
};

export const fetchBridgeColdWalletAddress = async () => {
    const baseUrl = useConfigBEInMemoryStore.getState().bridgeBackendApiUrl;
    if (baseUrl?.includes('env var not defined')) return;
    try {
        OpenAPI.BASE = baseUrl;
        await WrapTokenService.getWrapTokenParams().then((response) => {
            console.info('Bridge safe wallet address fetched successfully:', response);
            useWalletStore.setState({
                cold_wallet_address: response.coldWalletAddress,
            });
        });
    } catch (error) {
        console.error('Could not get bridge safe wallet address: ', error);
    }
};

export const importSeedWords = async (seedWords: string[]) => {
    useWalletStore.setState({
        is_wallet_importing: true,
        coinbase_transactions: [],
        transactions: [],
        bridge_transactions: [],
        has_more_coinbase_transactions: true,
        has_more_transactions: true,
        is_reward_history_loading: false,
        is_transactions_history_loading: false,
        wallet_scanning: {
            is_scanning: true,
            scanned_height: 0,
            total_height: 0,
            progress: 0,
        },
    });
    try {
        await invoke('import_seed_words', { seedWords });
        await refreshTransactions();
        useWalletStore.setState({ is_wallet_importing: false });
    } catch (error) {
        setError(`Could not import seed words: ${error}`, true);
        useWalletStore.setState({ is_wallet_importing: false });
    } finally {
        useWalletStore.setState({ is_wallet_importing: false });
    }
};

export const refreshTransactions = async () => {
    const { tx_history, coinbase_transactions, tx_history_filter } = useWalletStore.getState();
    await fetchTransactions({ offset: 0, limit: Math.max(tx_history.length, 20), filter: tx_history_filter });
    await fetchTransactions({
        offset: 0,
        limit: Math.max(coinbase_transactions.length, 20),
        filter: 'rewards',
        storeKey: 'coinbase_transactions',
    });
};

export const setExternalTariAddress = async (newAddress: string) => {
    await invoke('set_external_tari_address', { address: newAddress })
        .then(() => {
            console.info('New Tari address set successfully to:', newAddress);
        })
        .catch((e) => {
            console.error('Could not set Monero address', e);
            setError('Could not change Monero address');
        });
};

const getPendingOutgoingBalance = async () => {
    try {
        const fetchedTxs = await invoke('get_transactions', { limit: 20, statusBitflag: 3 });
        return fetchedTxs
            .filter((tx) => tx.direction == TransactionDirection.Outbound)
            .reduce((acc, tx) => acc + tx.amount, 0);
    } catch (error) {
        console.error('Failed to fetch transactions:', error);
        return 0;
    }
};

export const setWalletBalance = async (balance: WalletBalance) => {
    const pendingOutgoingBalance = await getPendingOutgoingBalance();
    console.info('Setting new wallet balance: ', { balance, pendingOutgoingBalance });
    const available_balance = balance.available_balance - pendingOutgoingBalance;
    const pending_outgoing_balance = balance.pending_outgoing_balance + pendingOutgoingBalance;

    const calculated_balance = available_balance + balance.timelocked_balance + balance.pending_incoming_balance;
    useWalletStore.setState({
        balance: { ...balance, available_balance, pending_outgoing_balance },
        calculated_balance,
    });
};

export const setIsSwapping = (isSwapping: boolean) => {
    useWalletStore.setState({ is_swapping: isSwapping });
};

export const setTxHistoryFilter = (filter: TxHistoryFilter) => {
    useWalletStore.setState({ tx_history_filter: filter });
};

export const setDetailsItem = (detailsItem: TransactionDetailsItem | BackendBridgeTransaction | null) =>
    useWalletStore.setState({ detailsItem });

export const handleExternalWalletAddressUpdate = (payload?: WalletAddress) => {
    const isSeedlessUI = useUIStore.getState().seedlessUI;
    if (payload) {
        useWalletStore.setState((c) => ({
            ...c,
            external_tari_address_base58: payload.tari_address_base58,
            external_tari_address_emoji: payload.tari_address_emoji,
        }));

        if (!isSeedlessUI) {
            setSeedlessUI(true);
        }
    } else {
        useWalletStore.setState((c) => ({
            ...c,
            external_tari_address_base58: undefined,
            external_tari_address_emoji: undefined,
        }));
        if (isSeedlessUI) {
            setSeedlessUI(false);
            setCurrentExchangeMinerId(universalExchangeMinerOption.exchange_id);
            refreshTransactions();
        }
    }
};

export const handleBaseWalletUpate = (payload: WalletAddress) => {
    useWalletStore.setState((c) => ({
        ...c,
        tari_address_base58: payload.tari_address_base58,
        tari_address_emoji: payload.tari_address_emoji,
    }));
};
