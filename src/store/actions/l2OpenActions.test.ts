import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { initialState, useL2WalletStore } from '../useL2WalletStore';
import { useWalletStore } from '../useWalletStore.ts';
import { useSecurityStore } from '../useSecurityStore.ts';
import { useUIStore } from '../useUIStore.ts';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import type { L2WalletState } from '@app/types/events-payloads.ts';
import { cancelOpenL2Wait, createPinAndOpenL2, openL2 } from './l2OpenActions';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const openState: L2WalletState = { enabled: true, locked: false, seed_source: 'l1', accounts: [] };
const lockedState: L2WalletState = { ...openState, locked: true };

/** Serves `before` from l2_get_state until `command` runs, then `after`. */
const serve = (before: L2WalletState, command?: string, after = openState, fail?: string) => {
    let state = before;
    vi.mocked(invoke).mockImplementation((async (cmd: string) => {
        if (cmd === 'l2_get_state') return state;
        if (cmd === command) {
            if (fail) throw fail;
            state = after;
        }
    }) as typeof invoke);
};

describe('openL2', () => {
    beforeEach(() => {
        cancelOpenL2Wait();
        vi.mocked(invoke).mockReset();
        useL2WalletStore.setState({ ...initialState }, true);
        useWalletStore.setState({ is_pin_locked: undefined });
        useSecurityStore.setState({ modal: null });
        useUIStore.setState({ l2Open: false });
        useToastStore.setState({ toasts: [] });
    });

    it('waits while the PIN state is unknown and unlocks L2 once it arrives as true', async () => {
        useWalletStore.setState({ is_pin_locked: undefined });
        serve(lockedState, 'unlock_l2_wallet');

        const pending = openL2();
        // Let any pending work run: nothing may reach the backend (no PIN prompt,
        // no unlock_l2_wallet) until the setup phase reports the PIN state.
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(useSecurityStore.getState().modal).toBeNull();
        expect(invoke).not.toHaveBeenCalled();

        useWalletStore.setState({ is_pin_locked: true });
        await pending;

        expect(useSecurityStore.getState().modal).toBeNull();
        expect(invoke).toHaveBeenCalledWith('unlock_l2_wallet');
        expect(useUIStore.getState().l2Open).toBe(true);
    });

    it('waits while the PIN state is unknown and asks for a PIN once it arrives as false', async () => {
        useWalletStore.setState({ is_pin_locked: undefined });

        const pending = openL2();

        expect(useSecurityStore.getState().modal).toBeNull();
        expect(invoke).not.toHaveBeenCalled();

        useWalletStore.setState({ is_pin_locked: false });
        await pending;

        expect(useSecurityStore.getState().modal).toBe('l2_pin_required');
        expect(useUIStore.getState().l2Open).toBe(false);
        expect(invoke).not.toHaveBeenCalled();
    });

    it('opens nothing when the wait is cancelled before the PIN state arrives', async () => {
        useWalletStore.setState({ is_pin_locked: undefined });

        const pending = openL2();
        cancelOpenL2Wait();
        await pending;

        expect(useSecurityStore.getState().modal).toBeNull();
        expect(useUIStore.getState().l2Open).toBe(false);
        expect(invoke).not.toHaveBeenCalled();
    });

    it('asks for a PIN to be set first, without touching L2', async () => {
        useWalletStore.setState({ is_pin_locked: false });
        await openL2();

        expect(useSecurityStore.getState().modal).toBe('l2_pin_required');
        expect(useUIStore.getState().l2Open).toBe(false);
        expect(invoke).not.toHaveBeenCalled();
    });

    it('opens the panel straight away when L2 is already open', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(openState);
        await openL2();

        expect(useUIStore.getState().l2Open).toBe(true);
        expect(invoke).not.toHaveBeenCalledWith('unlock_l2_wallet');
    });

    it.each([
        ['locked', lockedState],
        ['not enabled', initialState],
    ] as [string, L2WalletState][])('asks for the PIN when L2 is %s and opens the panel after', async (_, state) => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(state, 'unlock_l2_wallet');
        await openL2();

        expect(invoke).toHaveBeenCalledWith('unlock_l2_wallet');
        expect(useUIStore.getState().l2Open).toBe(true);
    });

    it('leaves the panel closed and stays quiet when the PIN prompt is cancelled', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(lockedState, 'unlock_l2_wallet', openState, 'PIN entry cancelled');
        await openL2();

        expect(useUIStore.getState().l2Open).toBe(false);
        expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('leaves the panel closed and says why when opening fails', async () => {
        useWalletStore.setState({ is_pin_locked: true });
        serve(lockedState, 'unlock_l2_wallet', openState, 'Indexer down');
        await openL2();

        expect(useUIStore.getState().l2Open).toBe(false);
        expect(useToastStore.getState().toasts).toHaveLength(1);
    });
});

describe('createPinAndOpenL2', () => {
    it('sets the PIN and opens L2 in one go', async () => {
        vi.mocked(invoke).mockReset();
        useUIStore.setState({ l2Open: false });
        serve(initialState, 'l2_create_pin_and_enable');
        await createPinAndOpenL2();

        expect(invoke).toHaveBeenCalledWith('l2_create_pin_and_enable');
        expect(invoke).not.toHaveBeenCalledWith('unlock_l2_wallet');
        expect(useUIStore.getState().l2Open).toBe(true);
    });
});
