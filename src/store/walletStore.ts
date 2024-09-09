import { create } from './create';

import { WalletBalance } from '@app/types/app-status.ts';

interface State extends WalletBalance {
    balance: number;
    previousBalance: number;
    balanceDiff: number;
}

interface Actions {
    setBalanceData: (wallet_balance?: WalletBalance) => void;
}
type WalletStore = State & Actions;

const initialState: State = {
    balance: 0,
    previousBalance: 0,
    balanceDiff: 0,
    available_balance: 0,
    timelocked_balance: 0,
    pending_incoming_balance: 0,
    pending_outgoing_balance: 0,
};

export const useWalletStore = create<WalletStore>()((set) => ({
    ...initialState,
    setBalanceData: (wallet_balance) =>
        set((state) => {
            const {
                available_balance = 0,
                timelocked_balance = 0,
                pending_incoming_balance = 0,
            } = wallet_balance || {};

            const newBalance = available_balance + timelocked_balance + pending_incoming_balance; //TM
            const hasChanged = state.balance != newBalance;
            const prevValue = hasChanged ? state.balance : state.previousBalance;
            return {
                ...wallet_balance,
                balance: newBalance,
                previousBalance: prevValue,
            };
        }),
}));
