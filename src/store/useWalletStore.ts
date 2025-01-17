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
    transactions: TransactionInfo[];
    isTransactionLoading: boolean;
    is_wallet_importing: boolean;
    has_more_transactions: boolean;
}

interface Actions {
    setWalletDetails: (tari_wallet_details: TariWalletDetails) => void;
    setTransactionsLoading: (isTransactionLoading: boolean) => void;
    setTransactions: (transactions?: TransactionInfo[]) => void;
    importSeedWords: (seedWords: string[]) => Promise<void>;
    fetchMoreTransactions: () => Promise<void>;
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
    has_more_transactions: true,
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
    fetchMoreTransactions: async () => {
        try {
            const moreTxs = await invoke('get_transaction_history', { continuation: true });
            set((state) => ({
                has_more_transactions: moreTxs.length > 0,
                transactions: [...state.transactions, ...moreTxs.sort((a, b) => b.timestamp - a.timestamp)],
            }));
        } catch (error) {
            console.error('Could not fetch more transactions: ', error);
        }
    },
    setTransactions: (transactions = []) => set({ has_more_transactions: transactions.length >= 20, transactions }),
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

export const handleTransactions = async () => {
    let transactions: TransactionInfo[] = [];
    const setupProgress = useAppStateStore.getState().setupProgress;
    if (useWalletStore.getState().isTransactionLoading || setupProgress < 0.75) {
        return;
    }
    try {
        useWalletStore.setState({ isTransactionLoading: true });
        const txs = await invoke('get_transaction_history');
        const sortedTransactions = txs.sort((a, b) => b.timestamp - a.timestamp);
        if (sortedTransactions?.length) {
            useWalletStore.setState({ transactions: sortedTransactions });
            transactions = sortedTransactions;
        }
    } catch (error) {
        if (error !== ALREADY_FETCHING.HISTORY) {
            console.error('Could not get transaction history: ', error);
        }
    } finally {
        useWalletStore.setState({ isTransactionLoading: false });
    }

    return transactions;
};
