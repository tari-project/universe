import { create } from './create';
import { TransactionInfo, WalletBalance } from '../types/app-status.ts';

import { TransactionDetailsItem } from '@app/types/transactions.ts';
import { UserTransactionDTO } from '@tari-project/wxtm-bridge-backend-api';
import { refreshTransactions } from '@app/hooks/wallet/useFetchTxHistory.ts';

export interface BackendBridgeTransaction extends UserTransactionDTO {
    sourceAddress?: string;
    mined_in_block_height?: number;
}

interface WalletStoreState {
    tari_address_base58: string;
    tari_address_emoji: string;
    is_tari_address_generated: boolean | null;
    balance?: WalletBalance;
    calculated_balance?: number;
    coinbase_transactions: TransactionInfo[];
    transactions: TransactionInfo[];
    // TODO: decide later for the best place to store this data
    bridge_transactions: BackendBridgeTransaction[];
    cold_wallet_address?: string;
    is_reward_history_loading: boolean;
    has_more_coinbase_transactions: boolean;
    has_more_transactions: boolean;
    is_transactions_history_loading: boolean;
    is_wallet_importing: boolean;
    is_swapping?: boolean;
    detailsItem?: TransactionDetailsItem | BackendBridgeTransaction | null;
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
    bridge_transactions: [],
    cold_wallet_address: undefined,
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
// const MAX_PENDING_TRANSACTIONS = 100; // Keep only the latest 100 pending transactions

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

// New function to prune transaction arrays when they get too large
export const pruneTransactionHistory = () => {
    useWalletStore.setState((state) => ({
        transactions: pruneTransactionArray(state.transactions, MAX_TRANSACTIONS_IN_MEMORY),
        coinbase_transactions: pruneTransactionArray(state.coinbase_transactions, MAX_COINBASE_TRANSACTIONS_IN_MEMORY),
    }));
};

// Function to clear old transaction data (can be called periodically or on certain events)
const _clearOldTransactionData = () => {
    console.info('Clearing old transaction data to free memory');
    pruneTransactionHistory();
};
