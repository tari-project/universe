import { create } from 'zustand';
import { WalletBalance } from '@app/types/app-status.ts';

interface State extends WalletBalance {
    balance: number;
}

interface Actions {
    setBalanceData: (wallet_balance?: WalletBalance) => void;
    setBalance: (balance: number) => void;
}
type WalletStore = State & Actions;

const initialState: State = {
    balance: 0,
    available_balance: 0,
    timelocked_balance: 0,
    pending_incoming_balance: 0,
    pending_outgoing_balance: 0,
};

const useWalletStore = create<WalletStore>()((set) => ({
    ...initialState,
    setBalance: (balance) => set({ balance }),
    setBalanceData: (wallet_balance) =>
        set(() => {
            const {
                available_balance = 0,
                timelocked_balance = 0,
                pending_incoming_balance = 0,
            } = wallet_balance || {};

            return { ...wallet_balance, balance: available_balance + timelocked_balance + pending_incoming_balance };
        }),
}));

export default useWalletStore;
