import { t } from 'i18next';
import { addToast } from '@app/components/ToastStack/useToastStore';
import type { L2ClaimResult, L2NetworkStats, L2WalletState } from '@app/types/events-payloads.ts';
import { useL2WalletStore } from '../useL2WalletStore';

/** The backend always sends the whole wallet state, so it replaces what the store holds for it. */
export const handleL2WalletStateUpdate = (state: L2WalletState) => {
    useL2WalletStore.setState({ enabled: state.enabled, accounts: state.accounts });
};

export const handleL2ClaimResult = (result: L2ClaimResult) => {
    if (result.accepted) {
        addToast({ title: t('l2.claim.confirmed', { ns: 'wallet' }), type: 'success' });
        return;
    }
    const text = result.not_yet_claimable ? t('l2.claim.not-yet-claimable', { ns: 'wallet' }) : result.reason;
    addToast({ title: t('l2.claim.rejected', { ns: 'wallet' }), text: text ?? undefined, type: 'error' });
};

export const handleL2NetworkStats = (networkStats: L2NetworkStats) => {
    useL2WalletStore.setState({ networkStats });
};
