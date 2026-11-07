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
 * The sidebar's way into L2. An open wallet just shows the panel. Without a PIN the user is
 * asked to set one first; otherwise the PIN prompt opens straight away, and the panel only
 * once the wallet is open.
 */
export const openL2 = async () => {
    const pinLocked = useWalletStore.getState().is_pin_locked;
    
    // If still loading PIN state, wait briefly then re-check
    if (pinLocked === undefined) {
        // Give wallet time to load, then proceed with normal flow
        await new Promise(resolve => setTimeout(resolve, 500));
        const updatedPinLocked = useWalletStore.getState().is_pin_locked;
        if (updatedPinLocked === undefined) {
            // Still undefined, show loading state or return
            console.warn('PIN state still loading, please try again');
            return;
        }
        if (!updatedPinLocked) {
            useSecurityStore.setState({ modal: 'l2_pin_required' });
            return;
        }
    } else if (!pinLocked) {
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
