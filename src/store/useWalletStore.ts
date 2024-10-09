import { create } from './create';
import { TransactionInfo, WalletBalance } from '../types/app-status.ts';
import { invoke } from '@tauri-apps/api';
import { useAppStateStore } from './appStateStore.ts';

interface State extends WalletBalance {
    tari_address_base58: string;
    tari_address_emoji: string;
    balance: number | null;
    transactions: TransactionInfo[];
    isTransactionLoading: boolean;
}

interface Actions {
    fetchWalletDetails: () => Promise<void>;
    fetchTransactionHistory: () => Promise<void>;
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
    transactions: [],
    isTransactionLoading: false,
};

export const useWalletStore = create<WalletStoreState>()((set, getState) => ({
    ...initialState,
    fetchWalletDetails: async () => {
        try {
            const tari_wallet_details = await invoke('get_tari_wallet_details');
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
        } catch (error) {
            console.error('Could not get tari wallet details: ', error);
        }
    },
    fetchTransactionHistory: async () => {
        if (getState().isTransactionLoading) return;

        set({ isTransactionLoading: true });
        try {
            const txs = await invoke('get_transaction_history');
            set({
                transactions: txs.sort((a, b) => b.timestamp - a.timestamp),
            });
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            appStateStore.setError('Could not get transaction history');
            console.error('Could not get transaction history: ', error);
        } finally {
            set({ isTransactionLoading: false });
        }
    },
}));
