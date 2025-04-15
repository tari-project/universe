import { create } from './create';
import { TransactionInfo, WalletBalance } from '../types/app-status.ts';
import { refreshTransactions } from './actions/walletStoreActions.ts';

interface PendingTransaction {
    tx_id: number;
    amount: number;
    dest_address: string;
    payment_id: string;
    direction: number;
    status: number;
    timestamp: number;
}

interface WalletStoreState {
    tari_address_base58: string;
    tari_address_emoji: string;
    balance?: WalletBalance;
    calculated_balance?: number;
    coinbase_transactions: TransactionInfo[];
    transactions: TransactionInfo[];
    pending_transactions: PendingTransaction[];
    is_reward_history_loading: boolean;
    has_more_coinbase_transactions: boolean;
    has_more_transactions: boolean;
    is_transactions_history_loading: boolean;
    is_wallet_importing: boolean;
    wallet_scanning: {
        is_scanning: boolean;
        scanned_height: number;
        total_height: number;
        progress: number;
    };
}

const initialState: WalletStoreState = {
    tari_address_base58: '',
    tari_address_emoji: '',
    coinbase_transactions: [],
    transactions: [],
    pending_transactions: [],
    has_more_coinbase_transactions: true,
    has_more_transactions: true,
    is_reward_history_loading: false,
    is_transactions_history_loading: false,
    is_wallet_importing: false,
    wallet_scanning: {
        is_scanning: true,
        scanned_height: 0,
        total_height: 0,
        progress: 0,
    },
};

export const useWalletStore = create<WalletStoreState>()(() => ({
    ...initialState,
}));

// Temporary solution until we use excess_sig to track pending transactions
export const addPendingTransaction = (payload: { amount: string; destination: string; paymentId: string }) => {
    const transaction: PendingTransaction = {
        tx_id: Date.now(),
        amount: Number(payload.amount.replace(/[Tt]$/, '000000')),
        dest_address: payload.destination,
        payment_id: payload.paymentId,
        direction: 2,
        status: 1,
        timestamp: Date.now(),
    };

    useWalletStore.setState((state) => ({
        pending_transactions: [transaction, ...state.pending_transactions],
    }));
};

export const updateWalletScanningProgress = (payload: {
    scanned_height: number;
    total_height: number;
    progress: number;
}) => {
    const is_scanning = payload.scanned_height < payload.total_height;
    useWalletStore.setState({
        wallet_scanning: {
            is_scanning,
            ...payload,
        },
    });

    if (!is_scanning) {
        refreshTransactions();
    }
};

export const refreshPendingTransactions = () => {
    useWalletStore.setState((state) => {
        // Filter out pending transactions that have matching confirmed transactions
        const updatedPendingTransactions = state.pending_transactions.filter((pending) => {
            const isConfirmed = state.transactions.some(
                (tx) => tx.amount === pending.amount && tx.payment_id === pending.payment_id
            );
            return !isConfirmed;
        });

        return {
            pending_transactions: updatedPendingTransactions,
        };
    });
};
