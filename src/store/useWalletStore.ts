import { create } from './create';
import { TariWalletDetails, TransactionInfo, WalletBalance } from '../types/app-status.ts';
import { invoke } from '@tauri-apps/api/core';

interface State extends WalletBalance {
    tari_address_base58: string;
    tari_address_emoji: string;
    tari_address?: string;
    balance: number | null;
    transactions: TransactionInfo[];
    isTransactionLoading: boolean;
    is_wallet_importing: boolean;
}

interface Actions {
    setWalletDetails: (tari_wallet_details: TariWalletDetails) => void;
    setTransactionsLoading: (isTransactionLoading: boolean) => void;
    setTransactions: (transactions?: TransactionInfo[]) => void;
    importSeedWords: (seedWords: string[]) => Promise<void>;
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
    is_wallet_importing: false,
};

export const useWalletStore = create<WalletStoreState>()((set) => ({
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
    setTransactions: (transactions) => set({ transactions }),
    setTransactionsLoading: (isTransactionLoading) => set({ isTransactionLoading }),
    importSeedWords: async (seedWords: string[]) => {
        try {
            set({ is_wallet_importing: true });
            await invoke('import_seed_words', { seedWords });
        } catch (error) {
            console.error('Could not import seed words: ', error);
        }
    },
}));
