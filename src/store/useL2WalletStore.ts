import { create } from 'zustand';
import type { L2Account, L2WalletState } from '@app/types/events-payloads.ts';

export const initialState: L2WalletState = {
    enabled: false,
    accounts: [],
};

/** Filled only by the L2WalletStateUpdate event and the l2_get_state command. */
export const useL2WalletStore = create<L2WalletState>()(() => ({ ...initialState }));

/** The account the panel shows: the default one, or the first if none is marked. */
export const selectL2Account = (state: L2WalletState): L2Account | undefined =>
    state.accounts.find((account) => account.is_default) ?? state.accounts[0];
