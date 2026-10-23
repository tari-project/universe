import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({
        onCloseRequested: vi.fn(),
        listen: vi.fn(),
    })),
}));

import { L2_UNAVAILABLE, TappletSigner } from './TappletSigner';
import { useWalletStore } from '@app/store/useWalletStore';
import { L2WalletState } from '@app/types/events-payloads';

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

    describe('Ootle methods', () => {
        const PAY_REF = '0f8fad5b-d9cb-469f-a165-70867728950e';
        const ADDRESS = 'otl_esm_1destination';

        function l2State(overrides: Partial<L2WalletState> = {}, status = 'Accepted'): L2WalletState {
            return {
                enabled: true,
                locked: false,
                seed_source: 'l1',
                accounts: [
                    {
                        name: 'default',
                        address: 'otl_esm_1mine',
                        component_address: 'component_abc',
                        public_key: 'aa',
                        is_default: true,
                        balance: { revealed: 1_000, confidential: 2_500_000 },
                        history: [],
                        transactions: [{ id: 'tx1', status, fee: 10, invalid_reason: null, timestamp: 0 }],
                    },
                ],
                ...overrides,
            };
        }

        /** Answers each command from `responses`, throwing the ones that are errors. */
        function mockCommands(responses: Record<string, unknown>) {
            vi.mocked(invoke).mockImplementation((async (cmd: string) => {
                const response = responses[cmd];
                if (response instanceof Error) throw response;
                return response;
            }) as typeof invoke);
        }

        afterEach(() => {
            vi.mocked(invoke).mockReset();
            vi.useRealTimers();
        });

        describe('getOotleAccount', () => {
            it('returns the default account address and network', async () => {
                mockCommands({ l2_get_state: l2State(), get_network: 'esmeralda' });

                await expect(signer.runOne('getOotleAccount', [])).resolves.toEqual({
                    address: 'otl_esm_1mine',
                    network: 'esmeralda',
                });
            });

            it.each([
                ['the network has no L2', new Error('Layer 2 is not available on mainnet')],
                ['L2 is not enabled', l2State({ enabled: false, accounts: [] })],
                ['the wallet is locked', l2State({ locked: true, accounts: [] })],
            ])('is l2_unavailable when %s', async (_, state) => {
                mockCommands({ l2_get_state: state, get_network: 'mainnet' });

                await expect(signer.runOne('getOotleAccount', [])).resolves.toEqual(L2_UNAVAILABLE);
            });
        });

        describe('getOotleBalance', () => {
            it('sums revealed and confidential micro XTR as a string', async () => {
                mockCommands({ l2_get_state: l2State() });

                await expect(signer.runOne('getOotleBalance', [])).resolves.toEqual({
                    available: '2501000',
                    pending: '0',
                });
            });

            it('is l2_unavailable when L2 is not enabled', async () => {
                mockCommands({ l2_get_state: l2State({ enabled: false, accounts: [] }) });

                await expect(signer.runOne('getOotleBalance', [])).resolves.toEqual(L2_UNAVAILABLE);
            });
        });

        describe('sendOotleStealth', () => {
            it('sends micro XTR as XTR from the default account with the pay ref', async () => {
                mockCommands({ l2_get_state: l2State(), l2_validate_address: null, l2_send: 'tx1' });

                const result = await signer.runOne('sendOotleStealth', [
                    { amount: '1500001', address: ADDRESS, payRef: PAY_REF },
                ]);

                expect(result).toEqual({ transactionId: 'tx1' });
                expect(invoke).toHaveBeenCalledWith('l2_validate_address', { address: ADDRESS });
                expect(invoke).toHaveBeenCalledWith('l2_send', {
                    account: 'component_abc',
                    destination: ADDRESS,
                    amount: '1.500001',
                    payRef: PAY_REF,
                });
            });

            it.each([
                [[]],
                [[{ amount: '0', address: ADDRESS, payRef: PAY_REF }]],
                [[{ amount: '-5', address: ADDRESS, payRef: PAY_REF }]],
                [[{ amount: '1.5', address: ADDRESS, payRef: PAY_REF }]],
                [[{ amount: 100, address: ADDRESS, payRef: PAY_REF }]],
                [[{ amount: '100', address: '', payRef: PAY_REF }]],
                [[{ amount: '100', address: ADDRESS }]],
                [[{ amount: '100', address: ADDRESS, payRef: 'bridge-1' }]],
                [[{ amount: '100', address: ADDRESS, payRef: '0f8fad5b-d9cb-169f-a165-70867728950e' }]],
                [[{ amount: '100', address: ADDRESS, payRef: `${PAY_REF}${PAY_REF}` }]],
            ])('rejects args %j without invoking any command', async (args) => {
                await expect(signer.runOne('sendOotleStealth', args)).rejects.toThrow(
                    'Invalid arguments for tapplet signer method: sendOotleStealth'
                );
                expect(invoke).not.toHaveBeenCalled();
            });

            it('rejects an address the backend says is invalid without sending', async () => {
                mockCommands({ l2_get_state: l2State(), l2_validate_address: new Error('Invalid L2 address') });

                await expect(
                    signer.runOne('sendOotleStealth', [{ amount: '100', address: ADDRESS, payRef: PAY_REF }])
                ).rejects.toThrow('Invalid arguments for tapplet signer method: sendOotleStealth');
                expect(invoke).not.toHaveBeenCalledWith('l2_send', expect.anything());
            });

            it('is l2_unavailable without sending when L2 is locked', async () => {
                mockCommands({ l2_get_state: l2State({ locked: true, accounts: [] }) });

                const result = await signer.runOne('sendOotleStealth', [
                    { amount: '100', address: ADDRESS, payRef: PAY_REF },
                ]);

                expect(result).toEqual(L2_UNAVAILABLE);
                expect(invoke).not.toHaveBeenCalledWith('l2_send', expect.anything());
            });

            it('throws when the PIN prompt is cancelled so the tapplet gets a resultError', async () => {
                mockCommands({
                    l2_get_state: l2State(),
                    l2_validate_address: null,
                    l2_send: new Error('PIN entry cancelled'),
                });

                await expect(
                    signer.runOne('sendOotleStealth', [{ amount: '100', address: ADDRESS, payRef: PAY_REF }])
                ).rejects.toThrow('PIN entry cancelled');
            });
        });

        describe('waitOotleTransaction', () => {
            it('returns the settled status', async () => {
                mockCommands({ l2_get_state: l2State({}, 'Accepted') });

                await expect(
                    signer.runOne('waitOotleTransaction', [{ transactionId: 'tx1', timeoutSecs: 30 }])
                ).resolves.toEqual({ status: 'Accepted' });
            });

            it('reports Pending once the timeout runs out', async () => {
                vi.useFakeTimers();
                mockCommands({ l2_get_state: l2State({}, 'Pending') });

                const result = signer.runOne('waitOotleTransaction', [{ transactionId: 'tx1', timeoutSecs: 5 }]);
                await vi.advanceTimersByTimeAsync(6_000);

                await expect(result).resolves.toEqual({ status: 'Pending' });
            });

            it('is l2_unavailable when the L2 state cannot be read', async () => {
                mockCommands({ l2_get_state: new Error('Layer 2 is not available on mainnet') });

                await expect(
                    signer.runOne('waitOotleTransaction', [{ transactionId: 'tx1', timeoutSecs: 30 }])
                ).resolves.toEqual(L2_UNAVAILABLE);
            });

            it.each([
                [[]],
                [[{ transactionId: '', timeoutSecs: 30 }]],
                [[{ transactionId: 'tx1' }]],
                [[{ transactionId: 'tx1', timeoutSecs: 0 }]],
                [[{ transactionId: 'tx1', timeoutSecs: 1.5 }]],
                [[{ transactionId: 'tx1', timeoutSecs: 601 }]],
                [[{ transactionId: 'tx1', timeoutSecs: '30' }]],
            ])('rejects args %j without invoking any command', async (args) => {
                await expect(signer.runOne('waitOotleTransaction', args)).rejects.toThrow(
                    'Invalid arguments for tapplet signer method: waitOotleTransaction'
                );
                expect(invoke).not.toHaveBeenCalled();
            });
        });
    });

    describe('getTariBalance', () => {
        it('returns the legacy field names the shipped bridge reads', async () => {
            useWalletStore.setState({ account_balance: { total: 10, available: 7, locked: 2, unconfirmed: 1 } });

            await expect(signer.runOne('getTariBalance', [])).resolves.toEqual({
                available_balance: 7,
                timelocked_balance: 2,
                pending_incoming_balance: 1,
                pending_outgoing_balance: 0,
            });
        });

        it('reports zeroes when the balance is not known yet', async () => {
            useWalletStore.setState({ account_balance: undefined });

            await expect(signer.runOne('getTariBalance', [])).resolves.toEqual({
                available_balance: 0,
                timelocked_balance: 0,
                pending_incoming_balance: 0,
                pending_outgoing_balance: 0,
            });
        });
    });
});
