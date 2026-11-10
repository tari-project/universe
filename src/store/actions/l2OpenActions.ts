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
let pinWait: Promise<boolean | undefined> | null = null;
let cancelPinWait: (() => void) | null = null;

/**
 * Asks the backend for the PIN state and caches the answer in the wallet
 * store. The store normally learns the state from the setup event; asking
 * directly covers a click that lands before that event (or after it was
 * missed), so the flow below never has to guess. Resolves undefined when
 * the query itself failed, leaving the state unknown.
 */
export const refreshPinLockedState = async (): Promise<boolean | undefined> => {
    try {
        const value = await invoke<boolean>('is_pin_locked');
        if (typeof value !== 'boolean') {
            return undefined;
        }
        useWalletStore.setState({ is_pin_locked: value });
        return value;
    } catch (e) {
        console.warn('Could not query the PIN state:', e);
        return undefined;
    }
};

// Waits for the backend to report the PIN state during wallet setup. Resolves
// undefined when the wait is cancelled (the panel was closed while loading).
// Deliberately no timeout: a timeout that guessed "no PIN" would reopen the
// #3518 bug on a slow wallet load, so the click waits for the real state.
// The wait also asks the backend once (refreshPinLockedState): if the setup
// event was already sent and missed, the answer settles the wait through
// the store instead of leaving the click pending until the next event.
const waitForPinState = (): Promise<boolean | undefined> => {
    const current = useWalletStore.getState().is_pin_locked;
    if (current !== undefined) {
        return Promise.resolve(current);
    }
    if (pinWait) {
        return pinWait;
    }
    pinWait = new Promise<boolean | undefined>((resolve) => {
        let settled = false;
        const settle = (value: boolean | undefined) => {
            if (settled) return;
            settled = true;
            pinWait = null;
            cancelPinWait = null;
            unsubscribe();
            resolve(value);
        };
        const unsubscribe = useWalletStore.subscribe((state) => {
            if (state.is_pin_locked !== undefined) {
                settle(state.is_pin_locked);
            }
        });
        cancelPinWait = () => settle(undefined);
        // The state may have arrived between the first read and the subscribe.
        const latest = useWalletStore.getState().is_pin_locked;
        if (latest !== undefined) {
            settle(latest);
        }
        if (!settled) {
            void refreshPinLockedState();
        }
    });
    return pinWait;
};

/** Cancels a pending wait for the PIN state (used when the L2 panel is closed). */
export const cancelOpenL2Wait = () => {
    cancelPinWait?.();
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
 * The sidebar's way into L2. An open wallet just shows the panel. Without a PIN the user is
 * asked to set one first; otherwise the PIN prompt opens straight away, and the panel only
 * once the wallet is open.
 */
export const openL2 = async () => {
    if (opening || pinWait) return;
    // While the wallet is still loading, wait for the real PIN state instead of
    // guessing: opening the create-PIN dialog here is the #3518 bug (a wallet
    // that already has a PIN would be asked to set one). A cancelled wait
    // resolves undefined, so this is a no-op in that case.
    const isPinLocked = await waitForPinState();
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
