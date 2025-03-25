import { create } from './create';
import { TransactionInfo, WalletBalance } from '../types/app-status.ts';

interface WalletStoreState {
    tari_address_base58: string;
    tari_address_emoji: string;
    balance?: WalletBalance;
    calculated_balance?: number;
    coinbase_transactions: TransactionInfo[];
    transactions: TransactionInfo[];
    is_reward_history_loading: boolean;
    has_more_coinbase_transactions: boolean;
    has_more_transactions: boolean;
    is_transactions_history_loading: boolean;
    is_wallet_importing: boolean;
}

const initialState: WalletStoreState = {
    tari_address_base58: '',
    tari_address_emoji: '',
    coinbase_transactions: [],
    transactions: [],
    has_more_coinbase_transactions: true,
    has_more_transactions: true,
    is_reward_history_loading: false,
    is_transactions_history_loading: false,
    is_wallet_importing: false,
};

export const useWalletStore = create<WalletStoreState>()(() => ({
    ...initialState,
}));
