import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({
        onCloseRequested: vi.fn(),
        listen: vi.fn(),
    })),
}));

import { TappletSigner } from './TappletSigner';

describe('TappletSigner.runOne', () => {
    let signer: TappletSigner;

    beforeEach(() => {
        vi.mocked(invoke).mockClear();
        signer = TappletSigner.build({ id: 'test' });
    });

    describe('allowlisted methods', () => {
        it('dispatches a method the bridge tapplet needs', async () => {
            await expect(signer.runOne('isConnected', [])).resolves.toBe(true);
        });

        it('dispatches a method that reads wallet state', async () => {
            const account = await signer.runOne('getAccount', []);
            expect(account).toHaveProperty('account_id', 0);
            expect(account).toHaveProperty('address');
        });

        it('dispatches sendOneSided with valid arguments', async () => {
            const result = await signer.runOne('sendOneSided', [
                { amount: '100', address: 'tari-address', paymentId: 'bridge-1' },
            ]);

            expect(invoke).toHaveBeenCalledWith('send_one_sided_to_stealth_address', {
                amount: '100',
                destination: 'tari-address',
                paymentId: 'bridge-1',
            });
            expect(result).toBe(true);
        });

        it('accepts sendOneSided without a payment id', async () => {
            await signer.runOne('sendOneSided', [{ amount: '100', address: 'tari-address' }]);
            expect(invoke).toHaveBeenCalledTimes(1);
        });
    });

    describe('methods outside the allowlist', () => {
        it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf', 'notARealMethod'])(
            'refuses to call "%s"',
            async (method) => {
                const result = await signer.runOne(method, []);
                expect(result).toEqual({ error: `Unsupported tapplet signer method: ${method}` });
            }
        );

        it('refuses internal helpers that are not part of the tapplet api', async () => {
            await expect(signer.runOne('runOne', ['isConnected', []])).resolves.toEqual({
                error: 'Unsupported tapplet signer method: runOne',
            });
            await expect(signer.runOne('setWindowSize', [1, 1])).resolves.toEqual({
                error: 'Unsupported tapplet signer method: setWindowSize',
            });
            await expect(signer.runOne('sendWindowSizeMessage', [window, '*'])).resolves.toEqual({
                error: 'Unsupported tapplet signer method: sendWindowSizeMessage',
            });
        });

        it('refuses non-string method names', async () => {
            await expect(signer.runOne(undefined, [])).resolves.toEqual({
                error: 'Unsupported tapplet signer method: undefined',
            });
            await expect(signer.runOne({ toString: () => 'isConnected' }, [])).resolves.toHaveProperty('error');
        });

        it('does not mutate the prototype when called with __proto__', async () => {
            await signer.runOne('__proto__', [{ polluted: true }]);
            expect((signer as unknown as Record<string, unknown>).polluted).toBeUndefined();
        });
    });

    describe('argument validation', () => {
        it.each([
            [[]],
            [[undefined]],
            [[{ amount: '', address: 'tari-address' }]],
            [[{ amount: '100', address: '' }]],
            [[{ amount: 100, address: 'tari-address' }]],
            [[{ amount: '100' }]],
            [[{ amount: '100', address: 'tari-address', paymentId: 42 }]],
            [['100']],
        ])('rejects sendOneSided args %j without invoking the command', async (args) => {
            const result = await signer.runOne('sendOneSided', args);

            expect(result).toEqual({ error: 'Invalid arguments for tapplet signer method: sendOneSided' });
            expect(invoke).not.toHaveBeenCalled();
        });

        it('rejects setOngoingBridgeTx with a malformed transaction', async () => {
            await expect(signer.runOne('setOngoingBridgeTx', [{ amount: '100' }])).resolves.toEqual({
                error: 'Invalid arguments for tapplet signer method: setOngoingBridgeTx',
            });
        });

        it('tolerates a missing args array', async () => {
            await expect(signer.runOne('isConnected', undefined)).resolves.toBe(true);
        });
    });
});
