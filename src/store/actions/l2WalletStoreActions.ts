import { t } from 'i18next';
import { invoke } from '@tauri-apps/api/core';
import { addToast } from '@app/components/ToastStack/useToastStore';
import type { L2ClaimResult, L2NetworkStats, L2WalletState } from '@app/types/events-payloads.ts';
import { useL2WalletStore } from '../useL2WalletStore';

/** The backend always sends the whole wallet state, so it replaces what the store holds for it. */
export const handleL2WalletStateUpdate = (state: L2WalletState) => {
    useL2WalletStore.setState({
        enabled: state.enabled,
        locked: state.locked,
        accounts: state.accounts,
        seed_source: state.seed_source,
    });
};

/** The backend's PIN / confirmation gate said no: a normal outcome, not an error to show. */
export const PIN_CANCELLED_RE = /PIN entry cancelled|User canceled|denied by user/i;

/** Import and reset restart the wallet phase, which sends the new state when it's back. */
const changeL2Seed = async (command: string, args?: Record<string, unknown>) => {
    useL2WalletStore.setState({ seedChangePending: true });
    try {
        await invoke(command, args);
    } catch (e) {
        const message = String(e);
        if (!PIN_CANCELLED_RE.test(message)) {
            addToast({ title: t('l2.seed-change-error', { ns: 'settings' }), text: message, type: 'error' });
        }
        console.error(`${command} failed`, e);
    } finally {
        useL2WalletStore.setState({ seedChangePending: false });
    }
};

export const importL2SeedWords = (seedWords: string[]) => changeL2Seed('l2_import_seed_words', { seedWords });
export const resetL2ToL1Seed = () => changeL2Seed('l2_use_l1_seed');

/** Toast titles for a send or conversion that settled, accepted first. */
const SETTLED_TITLES: Record<Exclude<L2ClaimResult['kind'], 'claim'>, [string, string]> = {
    send: ['l2.send.confirmed', 'l2.send.rejected'],
    shield: ['l2.shield.confirmed', 'l2.shield.rejected'],
    unshield: ['l2.unshield.confirmed', 'l2.unshield.rejected'],
};

export const handleL2ClaimResult = (result: L2ClaimResult) => {
    if (result.kind !== 'claim') {
        const [confirmed, rejected] = SETTLED_TITLES[result.kind];
        addToast({
            title: t(result.accepted ? confirmed : rejected, { ns: 'wallet' }),
            text: result.reason ?? undefined,
            type: result.accepted ? 'success' : 'error',
        });
        return;
    }
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
