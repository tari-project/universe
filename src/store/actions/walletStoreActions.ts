import { invoke } from '@tauri-apps/api/core';
import { ALREADY_FETCHING } from '@app/App/sentryIgnore.ts';
import { WalletAddress, WalletBalance } from '@app/types/app-status.ts';
import { useWalletStore } from '../useWalletStore';

interface TxArgs {
    continuation: boolean;
    limit?: number;
}

export const fetchCoinbaseTransactions = async ({ continuation, limit }: TxArgs) => {
    if (useWalletStore.getState().is_reward_history_loading) {
        return [];
    }

    try {
        useWalletStore.setState({ is_reward_history_loading: true });

        const currentCoinbaseTx = useWalletStore.getState().coinbase_transactions;

        const fetchedTxs = await invoke('get_coinbase_transactions', { continuation, limit });
        const coinbase_transactions = continuation ? [...currentCoinbaseTx, ...fetchedTxs] : fetchedTxs;
        const has_more_coinbase_transactions = fetchedTxs.length > 0 && (!limit || fetchedTxs.length === limit);
        useWalletStore.setState({
            has_more_coinbase_transactions,
            coinbase_transactions,
        });
        return coinbase_transactions;
    } catch (error) {
        if (error !== ALREADY_FETCHING.HISTORY) {
            console.error('Could not get transaction history: ', error);
        }
        return [];
    } finally {
        useWalletStore.setState({ is_reward_history_loading: false });
    }
};
export const fetchTransactionsHistory = async ({ continuation, limit }: TxArgs) => {
    if (useWalletStore.getState().is_transactions_history_loading) {
        return [];
    }

    try {
        useWalletStore.setState({ is_transactions_history_loading: true });
        const currentTxs = useWalletStore.getState().transactions;
        const fetchedTxs = await invoke('get_transactions_history', { continuation, limit });

        const transactions = continuation ? [...currentTxs, ...fetchedTxs] : fetchedTxs;
        const has_more_transactions = fetchedTxs.length > 0 && (!limit || fetchedTxs.length === limit);
        useWalletStore.setState({
            has_more_transactions,
            transactions,
        });
        return transactions;
    } catch (error) {
        if (error !== ALREADY_FETCHING.HISTORY) {
            console.error('Could not get transaction history: ', error);
        }
        return [];
    } finally {
        useWalletStore.setState({ is_transactions_history_loading: false });
    }
};
export const importSeedWords = async (seedWords: string[]) => {
    try {
        useWalletStore.setState({ is_wallet_importing: true });
        await invoke('import_seed_words', { seedWords });
    } catch (error) {
        console.error('Could not import seed words: ', error);
    }
};
export const initialFetchTxs = () => {
    void fetchTransactionsHistory({ continuation: false, limit: 20 });
};
export const refreshCoinbaseTransactions = async () => {
    const limit = useWalletStore.getState().coinbase_transactions.length;
    return fetchCoinbaseTransactions({ continuation: false, limit: Math.max(limit, 20) });
};

export const setWalletAddress = (addresses: WalletAddress) => {
    useWalletStore.setState({
        tari_address_base58: addresses.tari_address_base58,
        tari_address_emoji: addresses.tari_address_emoji,
    });
};
export const setWalletBalance = (balance: WalletBalance) => {
    const calculated_balance =
        balance.available_balance + balance.timelocked_balance + balance.pending_incoming_balance;
    useWalletStore.setState({ balance, calculated_balance });
};
