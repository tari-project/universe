import { invoke } from '@tauri-apps/api/core';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

import { FindWalletsResult } from '@app/types/wallet-recovery.ts';
import { useFindMyWallets } from './useFindMyWallets';

// `invoke` is declared as a long overload list, so the mock is reached through one loose handle.
const mockedInvoke = invoke as unknown as Mock;

const FOUND: FindWalletsResult = {
    kind: 'found',
    wallets: [
        { wallet_id: 'one', address_prefix: '12345678', is_linked: true, is_active: true, status: 'readable' },
        { wallet_id: 'two', address_prefix: 'abcdefgh', is_linked: false, is_active: false, status: 'readable' },
    ],
};

function mockSearch(result: FindWalletsResult = FOUND) {
    mockedInvoke.mockImplementation((command: string) => {
        if (command === 'find_my_wallets') return Promise.resolve(result);
        return Promise.reject(new Error(`unexpected command: ${command}`));
    });
}

async function searchedHook() {
    const hook = renderHook(() => useFindMyWallets());
    await act(async () => {
        await hook.result.current.search();
    });
    return hook;
}

describe('useFindMyWallets', () => {
    beforeEach(() => {
        mockedInvoke.mockReset();
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('stores the search result', async () => {
        mockSearch();
        const { result } = await searchedHook();

        expect(result.current.result).toEqual(FOUND);
        expect(result.current.error).toBeNull();
    });

    it('does not search again after a successful re-link', async () => {
        mockSearch();
        const { result } = await searchedHook();

        mockedInvoke.mockResolvedValueOnce('abcdefgh');
        await act(async () => {
            await result.current.relink('two');
        });

        expect(mockedInvoke.mock.calls.filter(([command]) => command === 'find_my_wallets')).toHaveLength(1);
        expect(mockedInvoke).toHaveBeenLastCalledWith('relink_wallet', { walletId: 'two' });
    });

    it('patches the list so only the re-linked wallet is active', async () => {
        mockSearch();
        const { result } = await searchedHook();

        mockedInvoke.mockResolvedValueOnce('abcdefgh');
        await act(async () => {
            await result.current.relink('two');
        });

        await waitFor(() => {
            expect(result.current.result).toEqual({
                kind: 'found',
                wallets: [
                    { ...FOUND.wallets[0], is_active: false },
                    { ...FOUND.wallets[1], is_active: true, is_linked: true },
                ],
            });
        });
    });

    it('returns the address prefix from a re-link', async () => {
        mockSearch();
        const { result } = await searchedHook();

        mockedInvoke.mockResolvedValueOnce('abcdefgh');
        let prefix: string | null = null;
        await act(async () => {
            prefix = await result.current.relink('two');
        });

        expect(prefix).toBe('abcdefgh');
    });

    it('shows nothing when the user cancels the PIN prompt', async () => {
        mockSearch();
        const { result } = await searchedHook();

        mockedInvoke.mockRejectedValueOnce('PIN entry cancelled');
        await act(async () => {
            await result.current.relink('two');
        });

        expect(result.current.error).toBeNull();
    });

    it('maps a PIN lockout to its own key and keeps the remaining seconds', async () => {
        mockSearch();
        const { result } = await searchedHook();

        mockedInvoke.mockRejectedValueOnce('Pin is locked out. Remaining seconds: 42');
        await act(async () => {
            await result.current.relink('two');
        });

        expect(result.current.error).toEqual({ key: 'find-my-wallets-error-pin-locked-seconds', seconds: 42 });
    });

    it('maps a PIN lockout without a countdown to the plain lockout key', async () => {
        mockSearch();
        const { result } = await searchedHook();

        mockedInvoke.mockRejectedValueOnce('Pin is locked out.');
        await act(async () => {
            await result.current.relink('two');
        });

        expect(result.current.error).toEqual({ key: 'find-my-wallets-error-pin-locked' });
    });

    it('maps a keyring failure to a key rather than the raw string', async () => {
        mockedInvoke.mockRejectedValue('Keyring had no entry for: inner_wallet_credentials_esmeralda_abc123');
        const { result } = await searchedHook();

        expect(result.current.error).toEqual({ key: 'find-my-wallets-error-keyring' });
        expect(JSON.stringify(result.current.error)).not.toContain('inner_wallet_credentials');
    });

    it('falls back to one generic key for unknown failures', async () => {
        mockedInvoke.mockRejectedValue(new Error('org.freedesktop.secrets is not provided by any .service file'));
        const { result } = await searchedHook();

        expect(result.current.error).toEqual({ key: 'find-my-wallets-error-generic' });
    });
});
