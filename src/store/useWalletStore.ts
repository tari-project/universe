import { create } from './create';
import { WalletAddress, TransactionInfo, WalletBalance } from '../types/app-status.ts';
import { invoke } from '@tauri-apps/api/core';
import { ALREADY_FETCHING } from '@app/App/sentryIgnore.ts';

interface State {
    tari_address_base58: string;
    tari_address_emoji: string;
    balance?: WalletBalance;
    calculated_balance?: number;
    coinbase_transactions: TransactionInfo[];
    is_reward_history_loading: boolean;
    has_more_coinbase_transactions: boolean;
    is_wallet_importing: boolean;
}

interface Actions {
    setWalletAddress: (wallet_address: WalletAddress) => void;
    setWalletBalance: (wallet_balance: WalletBalance) => void;
    importSeedWords: (seedWords: string[]) => Promise<void>;
    fetchCoinbaseTransactions: (continuation: boolean, limit?: number) => Promise<TransactionInfo[]>;
    refreshCoinbaseTransactions: () => Promise<TransactionInfo[]>;
}

type WalletStoreState = State & Actions;

const initialState: State = {
    tari_address_base58: '',
    tari_address_emoji: '',
    coinbase_transactions: [],
    has_more_coinbase_transactions: true,
    is_reward_history_loading: false,
    is_wallet_importing: false,
};

export const useWalletStore = create<WalletStoreState>()((set, getState) => ({
    ...initialState,
    setWalletAddress: (wallet_address) => {
        set({ ...wallet_address });
    },
    setWalletBalance: (balance) => {
        const calculated_balance =
            balance.available_balance + balance.timelocked_balance + balance.pending_incoming_balance;
        set({ balance, calculated_balance });
    },
    fetchCoinbaseTransactions: async (continuation, limit) => {
        if (useWalletStore.getState().is_reward_history_loading) {
            return [];
        }

        try {
            useWalletStore.setState({ is_reward_history_loading: true });

            const fetchedTxs = await invoke('get_coinbase_transactions', { continuation, limit });
            const coinbase_transactions = continuation
                ? [...getState().coinbase_transactions, ...fetchedTxs]
                : fetchedTxs;
            const has_more_coinbase_transactions = fetchedTxs.length > 0 && (!limit || fetchedTxs.length === limit);
            set({
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
    },
    refreshCoinbaseTransactions: async () => {
        const limit = getState().coinbase_transactions.length;
        return getState().fetchCoinbaseTransactions(false, Math.max(limit, 20));
    },
    importSeedWords: async (seedWords: string[]) => {
        try {
            set({ is_wallet_importing: true });
            await invoke('import_seed_words', { seedWords });
        } catch (error) {
            console.error('Could not import seed words: ', error);
        }
    },
}));

export const initialFetchTx = () => {
    useWalletStore.getState().fetchCoinbaseTransactions(false, 20);
};
