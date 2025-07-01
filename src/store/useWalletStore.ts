import { create } from './create';
import { TransactionInfo, WalletBalance } from '../types/app-status.ts';
import { refreshTransactions } from './actions/walletStoreActions.ts';
import { TxHistoryFilter } from '@app/components/transactions/history/FilterSelect.tsx';
import { UserTransactionDTO } from '@tari-project/wxtm-bridge-backend-api';
import { useUIStore } from './useUIStore.ts';
import { TransactionDetailsItem } from '@app/types/transactions.ts';

export interface BackendBridgeTransaction extends UserTransactionDTO {
    sourceAddress?: string;
    mined_in_block_height?: number;
}

export interface WalletStoreState {
    tari_address_base58: string;
    tari_address_emoji: string;
    external_tari_address_base58?: string;
    external_tari_address_emoji?: string;
    balance?: WalletBalance;
    calculated_balance?: number;
    coinbase_transactions: TransactionInfo[];
    tx_history_filter: TxHistoryFilter;
    tx_history: TransactionInfo[];
    // TODO: decide later for the best place to store this data
    bridge_transactions: BackendBridgeTransaction[];
    cold_wallet_address?: string;
    is_wallet_importing: boolean;
    is_swapping?: boolean;
    detailsItem?: TransactionDetailsItem | BackendBridgeTransaction | null;
    wallet_scanning: {
        is_scanning: boolean;
        scanned_height: number;
        total_height: number;
        progress: number;
    };
}

interface WalletStoreSelectors {
    getActiveTariAddress: () => [string, string];
}

const initialState: WalletStoreState = {
    tari_address_base58: '',
    tari_address_emoji: '',
    external_tari_address_base58: undefined,
    external_tari_address_emoji: undefined,
    coinbase_transactions: [],
    tx_history_filter: 'all-activity',
    tx_history: [],
    bridge_transactions: [],
    cold_wallet_address: undefined,
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

export const useWalletStore = create<WalletStoreState & WalletStoreSelectors>()((_, get) => ({
    ...initialState,
    getActiveTariAddress: () => {
        const baseAddress = get().tari_address_base58;
        const baseAddressEmoji = get().tari_address_emoji;
        const externalAddress = get().external_tari_address_base58;
        const externalAddressEmoji = get().external_tari_address_emoji;
        const isSeedlessUI = useUIStore.getState().seedlessUI;

        if (isSeedlessUI && externalAddress && externalAddressEmoji) {
            return [externalAddress, externalAddressEmoji];
        }
        return [baseAddress, baseAddressEmoji];
    },
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
        transactions: pruneTransactionArray(state.tx_history, MAX_TRANSACTIONS_IN_MEMORY),
        coinbase_transactions: pruneTransactionArray(state.coinbase_transactions, MAX_COINBASE_TRANSACTIONS_IN_MEMORY),
    }));
};

// Function to clear old transaction data (can be called periodically or on certain events)
const _clearOldTransactionData = () => {
    console.info('Clearing old transaction data to free memory');
    pruneTransactionHistory();
};
