import { create } from 'zustand';
import { AccountBalance, DisplayedTransaction } from '../types/app-status.ts';

import { TxHistoryFilter } from '@app/components/transactions/history/FilterSelect.tsx';
import { UserTransactionDTO } from '@tari-project/wxtm-bridge-backend-api';
import { TariAddressType, WalletScanningProgressUpdatePayload } from '@app/types/events-payloads.ts';
import { useExchangeStore } from './useExchangeStore.ts';

export interface BackendBridgeTransaction extends UserTransactionDTO {
    sourceAddress?: string;
    mined_in_block_height?: number;
}

export interface WalletBalanceExtended {
    account_balance: AccountBalance;
    display_balance: number;
}

export interface WalletStoreState {
    tari_address_base58: string;
    tari_address_emoji: string;
    tari_address_type: TariAddressType;
    exchange_wxtm_addresses: Record<string, string>;
    balance?: AccountBalance;
    calculated_balance?: number;
    transaction_history_filter: TxHistoryFilter;
    wallet_transactions: DisplayedTransaction[];
    // ========= Bridge related data ==========
    bridge_transactions: BackendBridgeTransaction[];
    cold_wallet_address?: string;
    // ========================================
    is_wallet_importing: boolean;
    is_swapping?: boolean;
    selectedTransactionId?: string | null;
    wallet_scanning: {
        scanned_height: number;
        total_height: number;
        progress: number;
        is_initial_scan_complete: boolean;
    };
    is_pin_locked: boolean;
    is_seed_backed_up: boolean;
}

export interface WalletStoreSelectors {
    getETHAddressOfCurrentExchange: () => string | undefined;
    selectedTransaction: () => DisplayedTransaction | null;
}

export const initialState: WalletStoreState = {
    tari_address_base58: '',
    tari_address_emoji: '',
    tari_address_type: TariAddressType.Internal,
    exchange_wxtm_addresses: {},
    transaction_history_filter: 'all-activity',
    wallet_transactions: [],
    bridge_transactions: [],
    cold_wallet_address: undefined,
    is_wallet_importing: false,
    wallet_scanning: {
        scanned_height: 0,
        total_height: 0,
        progress: 0,
        is_initial_scan_complete: false,
    },
    is_pin_locked: false,
    is_seed_backed_up: false,
};

export const useWalletStore = create<WalletStoreState & WalletStoreSelectors>()((_, get) => ({
    ...initialState,
    getETHAddressOfCurrentExchange: () => {
        const exchangeId = useExchangeStore.getState().currentExchangeMinerId;
        return get().exchange_wxtm_addresses[exchangeId] || undefined;
    },
    selectedTransaction: () => {
        const selectedId = get().selectedTransactionId;
        return selectedId ? get().wallet_transactions.find((tx) => tx.id === selectedId) || null : null;
    },
}));

export const updateWalletScanningProgress = (payload: WalletScanningProgressUpdatePayload) => {
    useWalletStore.setState((c) => ({
        ...c,
        wallet_scanning: {
            ...payload,
        },
    }));
};
