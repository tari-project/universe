import type { L2WalletState } from '@app/types/events-payloads.ts';
import { useL2WalletStore } from '../useL2WalletStore';

/** The backend always sends the whole state, so it replaces what the store holds. */
export const handleL2WalletStateUpdate = (state: L2WalletState) => {
    useL2WalletStore.setState(state, true);
};
