import { create } from 'zustand';
import type { L2Account, L2NetworkStats, L2WalletState } from '@app/types/events-payloads.ts';

interface L2WalletStoreState extends L2WalletState {
    networkStats: L2NetworkStats | null;
    /** An L2 seed import or reset is running. The wallet phase restarts, so enabled flips off and back. */
    seedChangePending: boolean;
}

export const initialState: L2WalletStoreState = {
    enabled: false,
    accounts: [],
    seed_source: 'l1',
    networkStats: null,
    seedChangePending: false,
};

/** Filled only by the L2WalletStateUpdate and L2NetworkStats events and the l2_get_state command. */
export const useL2WalletStore = create<L2WalletStoreState>()(() => ({ ...initialState }));

/** The account the panel shows: the default one, or the first if none is marked. */
export const selectL2Account = (state: L2WalletState): L2Account | undefined =>
    state.accounts.find((account) => account.is_default) ?? state.accounts[0];
