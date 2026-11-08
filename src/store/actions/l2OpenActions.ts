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
let pendingPinWait: Promise<boolean | undefined> | null = null;
let cancelPendingPinWait: (() => void) | null = null;

/**
 * Resolves once the L1 wallet's `is_pin_locked` state is known (`true` or `false`),
 * or `undefined` if cancelled before the wallet finishes loading.
 */
const waitForPinStatus = (): Promise<boolean | undefined> => {
    const current = useWalletStore.getState().is_pin_locked;
    if (current !== undefined) {
        return Promise.resolve(current);
    }
    if (pendingPinWait) {
        return pendingPinWait;
    }

    pendingPinWait = new Promise<boolean | undefined>((resolve) => {
        let settled = false;
        const finish = (value: boolean | undefined) => {
            if (settled) return;
            settled = true;
            pendingPinWait = null;
            cancelPendingPinWait = null;
            unsubscribe();
            resolve(value);
        };

        const unsubscribe = useWalletStore.subscribe((state) => {
            if (state.is_pin_locked !== undefined) {
                finish(state.is_pin_locked);
            }
        });

        cancelPendingPinWait = () => finish(undefined);

        // Re-check in case the state changed synchronously while subscribing.
        const latest = useWalletStore.getState().is_pin_locked;
        if (latest !== undefined) {
            finish(latest);
        }
    });

    return pendingPinWait;
};

/** Cancels any in-flight wait for the L1 wallet's PIN state (used when closing L2 or resetting tests). */
export const cancelOpenL2Wait = () => {
    cancelPendingPinWait?.();
};

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

/**
 * The sidebar's way into L2. An open wallet just shows the panel. While the L1 wallet is
 * still loading (`is_pin_locked === undefined`), waits for the PIN status event before
 * deciding whether to prompt to create a PIN (`false`) or unlock L2 (`true`).
 */
export const openL2 = async () => {
    if (opening || pendingPinWait) return;

    const isPinLocked = await waitForPinStatus();
    if (isPinLocked === undefined) {
        return;
    }
    if (!isPinLocked) {
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
