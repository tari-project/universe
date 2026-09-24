import type { L2NetworkStats, L2WalletState } from '@app/types/events-payloads.ts';
import { useL2WalletStore } from '../useL2WalletStore';

/** The backend always sends the whole wallet state, so it replaces what the store holds for it. */
export const handleL2WalletStateUpdate = (state: L2WalletState) => {
    useL2WalletStore.setState({ enabled: state.enabled, accounts: state.accounts });
};

export const handleL2NetworkStats = (networkStats: L2NetworkStats) => {
    useL2WalletStore.setState({ networkStats });
};
