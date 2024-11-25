import { ALREADY_FETCHING } from '@app/App/sentryIgnore';
import { create } from './create';
import { WalletBalance } from '../types/app-status.ts';
import { invoke } from '@tauri-apps/api';
import { Transaction } from '@app/types/wallet.ts';

interface State extends WalletBalance {
    tari_address_base58: string;
    tari_address_emoji: string;
    tari_address?: string;
    balance: number | null;
    transactions: Transaction[];
    isTransactionLoading: boolean;
    is_wallet_importing: boolean;
}

interface Actions {
    fetchWalletDetails: () => Promise<void>;
    setTransactionsLoading: (isTransactionLoading: boolean) => void;
    setTransactions: (transactions?: Transaction[]) => void;
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
            if (error !== ALREADY_FETCHING.BALANCE) {
                console.error('Could not get tari wallet details: ', error);
            }
        }
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
