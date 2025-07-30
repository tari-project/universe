import { invoke } from '@tauri-apps/api/core';
import { WalletBalance } from '@app/types/app-status.ts';
import { BackendBridgeTransaction, initialState, useWalletStore } from '../useWalletStore';
import { setError } from './appStateStoreActions';
import { TxHistoryFilter } from '@app/components/transactions/history/FilterSelect';
import { WrapTokenService, OpenAPI } from '@tari-project/wxtm-bridge-backend-api';
import { useConfigBEInMemoryStore } from '../useAppConfigStore';
import { TariAddressUpdatePayload } from '@app/types/events-payloads';
import { TransactionDetailsItem } from '@app/types/transactions';
import { addToast } from '@app/components/ToastStack/useToastStore';
import { t } from 'i18next';

// NOTE: Tx status differ for core and proto(grpc)
export const COINBASE_BITFLAG = 6144;
export const NON_COINBASE_BITFLAG = 2015;

export interface TxArgs {
    filter?: TxHistoryFilter;
    offset?: number;
    limit?: number;
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

export const fetchTransactionsHistory = async ({ offset = 0, limit, filter = 'all-activity' }: TxArgs) => {
    const bitflag = filterToBitflag(filter);
    try {
        const fetchedTxs = await invoke('get_transactions', { offset, limit, statusBitflag: bitflag });

        return fetchedTxs;
    } catch (error) {
        console.error(`Could not get transaction history for rewards: `, error);
        return [];
    }
};

export const fetchCoinbaseTransactions = async ({ offset = 0, limit }: Omit<TxArgs, 'filter'>) => {
    const bitflag = filterToBitflag('rewards');
    try {
        const currentTxs = useWalletStore.getState().coinbase_transactions;
        const fetchedTxs = await invoke('get_transactions', { offset, limit, statusBitflag: bitflag });

        const coinbase_transactions = offset > 0 ? [...currentTxs, ...fetchedTxs] : fetchedTxs;
        useWalletStore.setState({ coinbase_transactions: coinbase_transactions });
        return coinbase_transactions;
    } catch (error) {
        console.error(`Could not get transaction history for rewards: `, error);
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
        tx_history: [],
        bridge_transactions: [],
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
        addToast({
            title: t('success', { ns: 'airdrop' }),
            text: t('import-seed-success', { ns: 'settings' }),
            type: 'success',
        });
    } catch (error) {
        const errorMessage = error as unknown as string;
        if (!errorMessage.includes('User canceled the operation') && !errorMessage.includes('PIN entry cancelled')) {
            setError(`Could not import seed words: ${error}`, true);
        }
        useWalletStore.setState({ is_wallet_importing: false });
    } finally {
        useWalletStore.setState({ is_wallet_importing: false });
    }
};

export const refreshTransactions = async () => {
    const { tx_history, coinbase_transactions, tx_history_filter } = useWalletStore.getState();
    await fetchTransactionsHistory({ offset: 0, limit: Math.max(tx_history.length, 20), filter: tx_history_filter });
    await fetchCoinbaseTransactions({
        offset: 0,
        limit: Math.max(coinbase_transactions.length, 20),
    });
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
    const calculated_balance =
        balance.available_balance + balance.timelocked_balance + balance.pending_incoming_balance;
    useWalletStore.setState({
        balance: { ...balance },
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

export const handleSelectedTariAddressChange = (payload: TariAddressUpdatePayload) => {
    const { tari_address_base58, tari_address_emoji, tari_address_type } = payload;
    useWalletStore.setState({
        ...initialState,
        is_wallet_importing: useWalletStore.getState().is_wallet_importing,
        tari_address_base58,
        tari_address_emoji,
        tari_address_type,
    });
};
