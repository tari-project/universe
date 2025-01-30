import { create } from './create';
import { TariWalletDetails, TransactionInfo, WalletBalance } from '../types/app-status.ts';
import { invoke } from '@tauri-apps/api/core';
import { ALREADY_FETCHING } from '@app/App/sentryIgnore.ts';
import { useAppStateStore } from '@app/store/appStateStore.ts';

interface State extends WalletBalance {
    tari_address_base58: string;
    tari_address_emoji: string;
    tari_address?: string;
    balance: number | null;
    coinbase_transactions: TransactionInfo[];
    is_reward_history_loading: boolean;
    has_more_coinbase_transactions: boolean;
    is_wallet_importing: boolean;
}

interface Actions {
    setWalletDetails: (tari_wallet_details: TariWalletDetails) => void;
    importSeedWords: (seedWords: string[]) => Promise<void>;
    fetchCoinbaseTransactions: (continuation: boolean, limit?: number) => Promise<TransactionInfo[]>;
    refreshCoinbaseTransactions: () => Promise<TransactionInfo[]>;
}

type WalletStoreState = State & Actions;

const initialState: State = {
    tari_address_base58: '',
    tari_address_emoji: '',
    balance: null,
    available_balance: 0,
    timelocked_balance: 0,
    pending_incoming_balance: 0,
    pending_outgoing_balance: 0,
    coinbase_transactions: [],
    has_more_coinbase_transactions: true,
    is_reward_history_loading: false,
    is_wallet_importing: false,
};

export const useWalletStore = create<WalletStoreState>()((set, getState) => ({
    ...initialState,
    setWalletDetails: (tari_wallet_details) => {
        const {
            available_balance = 0,
            timelocked_balance = 0,
            pending_incoming_balance = 0,
        } = tari_wallet_details.wallet_balance || {};
        // Q: Should we subtract pending_outgoing_balance here?
        const newBalance = available_balance + timelocked_balance + pending_incoming_balance; //TM

        set({
            ...tari_wallet_details.wallet_balance,
            tari_address_base58: tari_wallet_details.tari_address_base58,
            tari_address_emoji: tari_wallet_details.tari_address_emoji,
            balance: tari_wallet_details?.wallet_balance ? newBalance : null,
        });
    },
    fetchCoinbaseTransactions: async (continuation, limit) => {
        const setupProgress = useAppStateStore.getState().setupProgress;
        if (useWalletStore.getState().is_reward_history_loading || setupProgress < 0.75) {
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
