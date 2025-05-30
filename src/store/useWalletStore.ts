import { create } from './create';
import { TransactionInfo, WalletBalance } from '../types/app-status.ts';
import { refreshTransactions, setWalletBalance } from './actions/walletStoreActions.ts';

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
    is_tari_address_generated: boolean | null;
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
    is_swapping?: boolean;
    wallet_scanning: {
        is_scanning: boolean;
        scanned_height: number;
        total_height: number;
        progress: number;
    };
    newestTxIdOnInitialFetch?: TransactionInfo['tx_id']; // only set once - needed to check against truly "new" txs for the badge
}

const initialState: WalletStoreState = {
    tari_address_base58: '',
    tari_address_emoji: '',
    is_tari_address_generated: null,
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

// Configuration for memory management
const MAX_TRANSACTIONS_IN_MEMORY = 1000; // Keep only the latest 1000 transactions
const MAX_COINBASE_TRANSACTIONS_IN_MEMORY = 500; // Keep only the latest 500 coinbase transactions
const MAX_PENDING_TRANSACTIONS = 100; // Keep only the latest 100 pending transactions

export const useWalletStore = create<WalletStoreState>()(() => ({
    ...initialState,
}));

// Helper function to prune large arrays
const pruneTransactionArray = <T extends { timestamp?: number; tx_id?: number }>(array: T[], maxSize: number): T[] => {
    if (array.length <= maxSize) return array;

    // Sort by timestamp (newest first) or tx_id as fallback, then take the latest
    return array
        .sort((a, b) => {
            const aTime = a.timestamp || a.tx_id || 0;
            const bTime = b.timestamp || b.tx_id || 0;
            return bTime - aTime;
        })
        .slice(0, maxSize);
};

// Temporary solution until we use excess_sig to track pending transactions
export const addPendingTransaction = (payload: { amount: number; destination: string; paymentId: string }) => {
    const transaction: PendingTransaction = {
        tx_id: Date.now(),
        amount: Number(payload.amount) * 1_000_000,
        dest_address: payload.destination,
        payment_id: payload.paymentId,
        direction: 2,
        status: 1,
        timestamp: Math.floor(Date.now() / 1000),
    };

    useWalletStore.setState((state) => {
        const newPendingTransactions = [transaction, ...state.pending_transactions];

        return {
            pending_transactions: pruneTransactionArray(newPendingTransactions, MAX_PENDING_TRANSACTIONS),
        };
    });

    const balance = useWalletStore.getState().balance;
    if (balance) {
        setWalletBalance(balance);
    }
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
            pending_transactions: pruneTransactionArray(updatedPendingTransactions, MAX_PENDING_TRANSACTIONS),
        };
    });
};

// New function to prune transaction arrays when they get too large
export const pruneTransactionHistory = () => {
    useWalletStore.setState((state) => ({
        transactions: pruneTransactionArray(state.transactions, MAX_TRANSACTIONS_IN_MEMORY),
        coinbase_transactions: pruneTransactionArray(state.coinbase_transactions, MAX_COINBASE_TRANSACTIONS_IN_MEMORY),
        pending_transactions: pruneTransactionArray(state.pending_transactions, MAX_PENDING_TRANSACTIONS),
    }));
};

// Function to clear old transaction data (can be called periodically or on certain events)
const _clearOldTransactionData = () => {
    console.info('Clearing old transaction data to free memory');
    pruneTransactionHistory();
};
