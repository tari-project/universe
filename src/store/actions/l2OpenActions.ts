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

/**
 * The wallet store starts with an unknown PIN state. Ask the backend rather than treating
 * that as "no PIN", which used to open the create-PIN dialog while the L1 wallet was loading.
 */
/** Reads the persisted PIN flag once. Later events still win if they arrive first. */
export async function ensurePinLockedState(): Promise<boolean | undefined> {
    const current = useWalletStore.getState().is_pin_locked;
    if (current !== undefined) return current;
    try {
        const locked = await invoke<boolean>('pin_locked');
        if (typeof locked !== 'boolean') return useWalletStore.getState().is_pin_locked;
        if (useWalletStore.getState().is_pin_locked === undefined) {
            useWalletStore.setState({ is_pin_locked: locked });
        }
        return useWalletStore.getState().is_pin_locked;
    } catch (e) {
        console.warn('Could not read PIN state:', e);
        return useWalletStore.getState().is_pin_locked;
    }
}

/**
 * The sidebar's way into L2. An open wallet just shows the panel. Without a PIN the user is
 * asked to set one first; otherwise the PIN prompt opens straight away, and the panel only
 * once the wallet is open. While the PIN state is still unknown this waits for the backend
 * instead of opening PIN setup.
 */
export const openL2 = async () => {
    const pinLocked = await ensurePinLockedState();
    if (pinLocked === undefined) {
        addToast({
            title: t('l2.open-error', { ns: 'wallet' }),
            text: t('l2.pin-still-loading', { ns: 'wallet' }),
            type: 'error',
        });
        return;
    }
    if (!pinLocked) {
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
