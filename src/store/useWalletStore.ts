import { create } from 'zustand';
import { TransactionInfo, WalletBalance } from '../types/app-status.ts';

import { TxHistoryFilter } from '@app/components/transactions/history/FilterSelect.tsx';
import { UserTransactionDTO } from '@tari-project/wxtm-bridge-backend-api';
import { TariAddressType, WalletScanningProgressUpdatePayload } from '@app/types/events-payloads.ts';
import { useExchangeStore } from './useExchangeStore.ts';

export interface BackendBridgeTransaction extends UserTransactionDTO {
    sourceAddress?: string;
    mined_in_block_height?: number;
}

export interface BridgeTransactionDetails {
    status: UserTransactionDTO.status;
    transactionHash?: string;
    amountAfterFee: string;
}
export interface WalletTransactionDetails extends Partial<TransactionInfo> {
    txId: number;
    direction: number;
    isCancelled: boolean;
    status: number;
    excessSig?: string;
    message?: string;
    paymentReference?: string;
    destAddressEmoji?: string;
}
// combined type for transactions
export interface CombinedBridgeWalletTransaction {
    destinationAddress: string;
    paymentId: string;
    feeAmount: number;
    createdAt: number;
    tokenAmount: number;
    mined_in_block_height?: number;
    sourceAddress?: string;
    walletTransactionDetails: WalletTransactionDetails;
    bridgeTransactionDetails?: BridgeTransactionDetails;
}

export interface WalletStoreState {
    tari_address_base58: string;
    tari_address_emoji: string;
    tari_address_type: TariAddressType;
    exchange_wxtm_addresses: Record<string, string>;
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
    detailsItem?: CombinedBridgeWalletTransaction | null;
    wallet_scanning: {
        scanned_height: number;
        total_height: number;
        progress: number;
        is_initial_scan_finished: boolean;
    };
    is_pin_locked: boolean;
    is_seed_backed_up: boolean;
}

export interface WalletStoreSelectors {
    getETHAddressOfCurrentExchange: () => string | undefined;
}

export const initialState: WalletStoreState = {
    tari_address_base58: '',
    tari_address_emoji: '',
    tari_address_type: TariAddressType.Internal,
    coinbase_transactions: [],
    exchange_wxtm_addresses: {},
    tx_history_filter: 'all-activity',
    tx_history: [],
    bridge_transactions: [],
    cold_wallet_address: undefined,
    is_wallet_importing: false,
    wallet_scanning: {
        scanned_height: 0,
        total_height: 0,
        progress: 0,
        is_initial_scan_finished: false,
    },
    is_pin_locked: false,
    is_seed_backed_up: false,
};

// Configuration for memory management
const MAX_TRANSACTIONS_IN_MEMORY = 1000; // Keep only the latest 1000 transactions
const MAX_COINBASE_TRANSACTIONS_IN_MEMORY = 500; // Keep only the latest 500 coinbase transactions
// const MAX_PENDING_TRANSACTIONS = 100; // Keep only the latest 100 pending transactions

export const useWalletStore = create<WalletStoreState & WalletStoreSelectors>()((_, get) => ({
    ...initialState,
    getETHAddressOfCurrentExchange: () => {
        const exchangeId = useExchangeStore.getState().currentExchangeMinerId;
        return get().exchange_wxtm_addresses[exchangeId] || undefined;
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

export const updateWalletScanningProgress = (payload: WalletScanningProgressUpdatePayload) => {
    useWalletStore.setState((c) => ({
        ...c,
        wallet_scanning: {
            ...payload,
        },
    }));
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
