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
    fetchCoinbaseTransactions: (
        continuation: boolean,
        limit?: number,
        isRefresh?: boolean
    ) => Promise<TransactionInfo[]>;
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
    fetchCoinbaseTransactions: async (continuation, limit, isRefresh = false) => {
        const setupProgress = useAppStateStore.getState().setupProgress;
        const setupComplete = useAppStateStore.getState().setupComplete;
        const currentLoading = getState().is_reward_history_loading;

        const currentTx = getState().coinbase_transactions;
        if (currentLoading || (!setupComplete && setupProgress < 0.75)) {
            return currentTx?.length ? currentTx : [];
        }

        try {
            set({ is_reward_history_loading: true });
            const fetchedTxs = await invoke('get_coinbase_transactions', { continuation, limit });
            const sortedTx = fetchedTxs?.sort((a, b) => b.timestamp - a.timestamp);
            const coinbase_transactions = continuation ? [...currentTx, ...sortedTx] : sortedTx;
            const has_more_coinbase_transactions = sortedTx.length > 0 && (!limit || sortedTx.length === limit);

            if (!isRefresh) {
                set({ has_more_coinbase_transactions, coinbase_transactions });
            }

            return coinbase_transactions;
        } catch (error) {
            if (error !== ALREADY_FETCHING.HISTORY) {
                console.error('Could not get transaction history: ', error);
            }
            return currentTx?.length ? currentTx : [];
        } finally {
            set({ is_reward_history_loading: false });
        }
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

export const refreshCoinbaseTransactions = async () => {
    const limit = useWalletStore.getState().coinbase_transactions.length;
    return useWalletStore.getState().fetchCoinbaseTransactions(false, Math.max(limit, 5));
};
