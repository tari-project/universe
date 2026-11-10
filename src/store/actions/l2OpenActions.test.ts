import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { initialState, useL2WalletStore } from '../useL2WalletStore';
import { useWalletStore } from '../useWalletStore.ts';
import { useSecurityStore } from '../useSecurityStore.ts';
import { useUIStore } from '../useUIStore.ts';
import { useToastStore } from '@app/components/ToastStack/useToastStore';
import type { L2WalletState } from '@app/types/events-payloads.ts';
import { createPinAndOpenL2, openL2 } from './l2OpenActions';

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
        vi.mocked(invoke).mockReset();
        useL2WalletStore.setState({ ...initialState }, true);
        useSecurityStore.setState({ modal: null });
        useUIStore.setState({ l2Open: false });
        useToastStore.setState({ toasts: [] });
        useWalletStore.setState({ is_pin_locked: undefined });
    });

    it('does not open PIN setup while the PIN state is still loading', async () => {
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'pin_locked') return true;
            if (cmd === 'l2_get_state') return lockedState;
            if (cmd === 'unlock_l2_wallet') return undefined;
        }) as typeof invoke);

        await openL2();

        expect(useSecurityStore.getState().modal).not.toBe('l2_pin_required');
        expect(invoke).toHaveBeenCalledWith('pin_locked');
        expect(invoke).toHaveBeenCalledWith('unlock_l2_wallet');
        expect(useUIStore.getState().l2Open).toBe(true);
        expect(useWalletStore.getState().is_pin_locked).toBe(true);
    });

    it('opens PIN setup when loading finishes with no PIN set', async () => {
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'pin_locked') return false;
        }) as typeof invoke);

        await openL2();

        expect(useSecurityStore.getState().modal).toBe('l2_pin_required');
        expect(useUIStore.getState().l2Open).toBe(false);
        expect(invoke).toHaveBeenCalledWith('pin_locked');
        expect(invoke).not.toHaveBeenCalledWith('unlock_l2_wallet');
        expect(invoke).not.toHaveBeenCalledWith('l2_create_pin_and_enable');
    });

    it('does not guess that there is no PIN when the PIN state cannot be read', async () => {
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'pin_locked') throw new Error('wallet not ready');
        }) as typeof invoke);

        await openL2();

        expect(useSecurityStore.getState().modal).toBeNull();
        expect(useUIStore.getState().l2Open).toBe(false);
        expect(useToastStore.getState().toasts).toHaveLength(1);
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
