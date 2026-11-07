import { t } from 'i18next';
import { invoke } from '@tauri-apps/api/core';
import { addToast } from '@app/components/ToastStack/useToastStore';
import type { L2WalletState } from '@app/types/events-payloads.ts';
import { useL2WalletStore } from '../useL2WalletStore';
import { useWalletStore } from '../useWalletStore.ts';
import { useSecurityStore } from '../useSecurityStore.ts';
import { handleL2WalletStateUpdate, PIN_CANCELLED_RE } from './l2WalletStoreActions.ts';
import { setL2Open } from './uiStoreActions.ts';

let opening = false;

/** Runs a backend command that asks for the PIN and opens L2, then shows the panel. */
const openWith = async (command: 'unlock_l2_wallet' | 'l2_create_pin_and_enable') => {
    if (opening) return;
    opening = true;
    try {
        await invoke(command);
        handleL2WalletStateUpdate(await invoke<L2WalletState>('l2_get_state'));
        setL2Open(true);
    } catch (e) {
        const message = String(e);
        if (!PIN_CANCELLED_RE.test(message)) {
            addToast({ title: t('l2.open-error', { ns: 'wallet' }), text: message, type: 'error' });
        }
        console.error(`${command} failed`, e);
    } finally {
        opening = false;
    }
};

const PIN_STATE_TIMEOUT_MS = 30_000;

/**
 * Resolves once the wallet setup phase has reported the PIN state, or after a
 * timeout so a stuck load cannot leave the L2 button hanging forever.
 */
const waitForPinState = () =>
    new Promise<void>((resolve) => {
        if (useWalletStore.getState().is_pin_locked !== undefined) {
            resolve();
            return;
        }
        const finish = () => {
            clearTimeout(timer);
            unsubscribe();
            resolve();
        };
        const timer = setTimeout(finish, PIN_STATE_TIMEOUT_MS);
        const unsubscribe = useWalletStore.subscribe((state) => {
            if (state.is_pin_locked !== undefined) finish();
        });
    });

/**
 * The sidebar's way into L2. An open wallet just shows the panel. Without a PIN the user is
 * asked to set one first; otherwise the PIN prompt opens straight away, and the panel only
 * once the wallet is open.
 */
export const openL2 = async () => {
    const pinLocked = useWalletStore.getState().is_pin_locked;
    if (pinLocked === undefined) {
        // The wallet setup phase has not reported the PIN state yet. Falling
        // through to the create-PIN dialog here is what asked users with an
        // existing PIN to set one, so wait for the load to finish instead.
        await waitForPinState();
    }
    if (!useWalletStore.getState().is_pin_locked) {
        useSecurityStore.setState({ modal: 'l2_pin_required' });
        return;
    }
    try {
        handleL2WalletStateUpdate(await invoke<L2WalletState>('l2_get_state'));
    } catch (e) {
        console.warn('Could not load L2 wallet state:', e);
    }
    const { enabled, locked } = useL2WalletStore.getState();
    if (enabled && !locked) {
        setL2Open(true);
        return;
    }
    await openWith('unlock_l2_wallet');
};

/** Sets the wallet PIN and opens L2 with it, so the user enters it once. */
export const createPinAndOpenL2 = () => openWith('l2_create_pin_and_enable');
