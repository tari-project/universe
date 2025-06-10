import { invoke } from '@tauri-apps/api/core';
import { ALREADY_FETCHING } from '@app/App/sentryIgnore.ts';
import { WalletAddress, WalletBalance } from '@app/types/app-status.ts';
import { useWalletStore } from '../useWalletStore';
import { restartMining } from './miningStoreActions';
import { setError } from './appStateStoreActions';
import { setExchangeContent } from '@app/store/useExchangeStore.ts';
import { TxHistoryFilter } from '@app/components/transactions/history/FilterSelect';
import { WrapTokenService, OpenAPI } from '@tari-project/wxtm-bridge-backend-api';
import { useConfigBEInMemoryStore } from '../useAppConfigStore';
import { TransactionDirection, TransactionStatus } from '@app/types/transactions';

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
        if (error !== ALREADY_FETCHING.HISTORY && error !== ALREADY_FETCHING.TX_HISTORY) {
            console.error(`Could not get transaction history for ${filter}: `, error);
        }
        return [];
    }
};

export const fetchBridgeTransactionsHistory = async () => {
    try {
        OpenAPI.BASE = useConfigBEInMemoryStore.getState().bridgeBackendApiUrl;
        await WrapTokenService.getUserTransactions(useWalletStore.getState().tari_address_base58).then((response) => {
            console.log('Bridge transactions fetched successfully:', response);
            useWalletStore.setState({
                bridge_transactions: response.transactions,
            });
        });
    } catch (error) {
        console.error('Could not get bridge transaction history: ', error);
    }
};

export const fetchBridgeColdWalletAddress = async () => {
    try {
        OpenAPI.BASE = useConfigBEInMemoryStore.getState().bridgeBackendApiUrl;
        await WrapTokenService.getWrapTokenParams().then((response) => {
            console.log('Bridge safe wallet address fetched successfully:', response);
            useWalletStore.setState({
                cold_wallet_address: response.coldWalletAddress,
            });
        });
    } catch (error) {
        console.error('Could not get bridge safe wallet address: ', error);
    }
};

export const importSeedWords = async (seedWords: string[]) => {
    try {
        useWalletStore.setState({ is_wallet_importing: true });
        await invoke('import_seed_words', { seedWords });
    } catch (error) {
        setError(`Could not import seed words: ${error}`, true);
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

export const setGeneratedTariAddress = async (newAddress: string) => {
    await invoke('set_tari_address', { address: newAddress })
        .then(() => {
            setExchangeContent(null);
            restartMining();
            console.info('New Tari address set successfully to:', newAddress);
        })
        .catch((e) => {
            console.error('Could not set Monero address', e);
            setError('Could not change Monero address');
        });
};

export const setWalletAddress = (addresses: Partial<WalletAddress>) => {
    useWalletStore.setState({
        tari_address_base58: addresses.tari_address_base58,
        tari_address_emoji: addresses.tari_address_emoji,
        is_tari_address_generated: addresses.is_tari_address_generated,
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
