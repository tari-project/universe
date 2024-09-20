import { create } from './create';
import { WalletBalance } from '../types/app-status.ts';
import { invoke } from '@tauri-apps/api';

interface State extends WalletBalance {
    tari_address_base58: string;
    tari_address_emoji: string;
    balance: number;
}

interface Actions {
    fetchWalletDetails: () => Promise<void>;
}

type WalletStoreState = State & Actions;

const initialState: State = {
    tari_address_base58: '',
    tari_address_emoji: '',
    balance: 0,
    available_balance: 0,
    timelocked_balance: 0,
    pending_incoming_balance: 0,
    pending_outgoing_balance: 0,
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
            // Q: Should we substract pending_outgoing_balance here?
            const newBalance = available_balance + timelocked_balance + pending_incoming_balance; //TM
            set({
                ...tari_wallet_details.wallet_balance,
                tari_address_base58: tari_wallet_details.tari_address_base58,
                tari_address_emoji: tari_wallet_details.tari_address_emoji,
                balance: newBalance,
            });
        } catch (error) {
            console.error('Could not get tari wallet details: ', error);
        }
    },
}));
