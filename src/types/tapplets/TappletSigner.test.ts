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
import { initialState as l2StoreInitialState, useL2WalletStore } from '@app/store/useL2WalletStore';
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
                        balance: { revealed: 1_000, confidential: 2_500_000, total: '2501000' },
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

        beforeEach(() => {
            vi.spyOn(console, 'error').mockImplementation(() => undefined);
        });

        afterEach(() => {
            vi.mocked(invoke).mockReset();
            vi.useRealTimers();
            useL2WalletStore.setState({ ...l2StoreInitialState });
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

            it('hides backend error text behind a fixed code', async () => {
                mockCommands({ l2_get_state: l2State(), get_network: new Error('config file unreadable at /home/x') });

                await expect(signer.runOne('getOotleAccount', [])).rejects.toThrow(/^failed$/);
                expect(console.error).toHaveBeenCalledWith(expect.stringContaining('config file unreadable'));
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

            it('passes the backend total through exactly past 2^53', async () => {
                const state = l2State();
                state.accounts[0].balance.total = '9007199254740993';
                mockCommands({ l2_get_state: state });

                await expect(signer.runOne('getOotleBalance', [])).resolves.toEqual({
                    available: '9007199254740993',
                    pending: '0',
                });
            });

            it('is l2_unavailable when L2 is not enabled', async () => {
                mockCommands({ l2_get_state: l2State({ enabled: false, accounts: [] }) });

                await expect(signer.runOne('getOotleBalance', [])).resolves.toEqual(L2_UNAVAILABLE);
            });

            it('reads an open wallet from the L2 store without asking the backend', async () => {
                useL2WalletStore.setState(l2State());

                for (let i = 0; i < 5; i++) {
                    await expect(signer.runOne('getOotleBalance', [])).resolves.toEqual({
                        available: '2501000',
                        pending: '0',
                    });
                }
                expect(invoke).not.toHaveBeenCalledWith('l2_get_state');
            });
        });

        describe('sendOotleStealth', () => {
            it('sends micro XTR as XTR from the default account with the pay ref', async () => {
                mockCommands({ l2_get_state: l2State(), l2_validate_address: null, l2_send_from_tapplet: 'tx1' });

                const result = await signer.runOne('sendOotleStealth', [
                    { amount: '1500001', address: ADDRESS, payRef: PAY_REF },
                ]);

                expect(result).toEqual({ transactionId: 'tx1' });
                expect(invoke).toHaveBeenCalledWith('l2_validate_address', { address: ADDRESS });
                expect(invoke).toHaveBeenCalledWith('l2_send_from_tapplet', {
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
                [[{ amount: '1'.repeat(21), address: ADDRESS, payRef: PAY_REF }]],
                [[{ amount: '9007199254740992', address: ADDRESS, payRef: PAY_REF }]],
                [[{ amount: '100', address: ` ${ADDRESS}`, payRef: PAY_REF }]],
                [[{ amount: '100', address: `${ADDRESS}\n`, payRef: PAY_REF }]],
                [[{ amount: '100', address: `otl_esm_1${'q'.repeat(300)}`, payRef: PAY_REF }]],
            ])('rejects args %j without invoking any command', async (args) => {
                await expect(signer.runOne('sendOotleStealth', args)).rejects.toThrow(
                    'Invalid arguments for tapplet signer method: sendOotleStealth'
                );
                expect(invoke).not.toHaveBeenCalled();
            });

            it('accepts the largest amount the PIN prompt can show exactly', async () => {
                mockCommands({ l2_get_state: l2State(), l2_validate_address: null, l2_send_from_tapplet: 'tx1' });

                await expect(
                    signer.runOne('sendOotleStealth', [
                        { amount: '9007199254740991', address: ADDRESS, payRef: PAY_REF },
                    ])
                ).resolves.toEqual({ transactionId: 'tx1' });
            });

            it('rejects an address the backend says is invalid without sending', async () => {
                mockCommands({ l2_get_state: l2State(), l2_validate_address: new Error('Invalid L2 address') });

                await expect(
                    signer.runOne('sendOotleStealth', [{ amount: '100', address: ADDRESS, payRef: PAY_REF }])
                ).rejects.toThrow('Invalid arguments for tapplet signer method: sendOotleStealth');
                expect(invoke).not.toHaveBeenCalledWith('l2_send_from_tapplet', expect.anything());
            });

            it('is l2_unavailable without sending when L2 is locked', async () => {
                mockCommands({ l2_get_state: l2State({ locked: true, accounts: [] }) });

                const result = await signer.runOne('sendOotleStealth', [
                    { amount: '100', address: ADDRESS, payRef: PAY_REF },
                ]);

                expect(result).toEqual(L2_UNAVAILABLE);
                expect(invoke).not.toHaveBeenCalledWith('l2_send_from_tapplet', expect.anything());
            });

            it.each([
                ['PIN entry cancelled', 'denied'],
                ['Pin is locked out. Remaining seconds: 290', 'denied'],
                ['L2 send failed: Wrong PIN entered!', 'denied'],
                ["L2 send failed: The L2 indexer didn't answer within 30 seconds", 'failed'],
                ['L2 send failed: request cancelled by the indexer', 'failed'],
            ])('turns the backend error "%s" into "%s"', async (backend, code) => {
                mockCommands({
                    l2_get_state: l2State(),
                    l2_validate_address: null,
                    l2_send_from_tapplet: new Error(backend),
                });

                await expect(
                    signer.runOne('sendOotleStealth', [{ amount: '100', address: ADDRESS, payRef: PAY_REF }])
                ).rejects.toThrow(new RegExp(`^${code}$`));
                expect(console.error).toHaveBeenCalledWith(expect.stringContaining(backend));
            });

            it('refuses a second send while one is in flight, then allows the next', async () => {
                let finishSend: (id: string) => void = () => undefined;
                vi.mocked(invoke).mockImplementation((async (cmd: string) => {
                    if (cmd === 'l2_get_state') return l2State();
                    if (cmd === 'l2_send_from_tapplet') return new Promise((resolve) => (finishSend = resolve));
                    return null;
                }) as typeof invoke);
                const req = [{ amount: '100', address: ADDRESS, payRef: PAY_REF }];

                const first = signer.runOne('sendOotleStealth', req);
                await vi.waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_send_from_tapplet', expect.anything()));
                await expect(signer.runOne('sendOotleStealth', req)).rejects.toThrow(/^busy$/);

                finishSend('tx1');
                await expect(first).resolves.toEqual({ transactionId: 'tx1' });
                finishSend = () => undefined;
                const next = signer.runOne('sendOotleStealth', req);
                await vi.waitFor(() => {
                    const sends = vi
                        .mocked(invoke)
                        .mock.calls.filter(([cmd]) => String(cmd) === 'l2_send_from_tapplet');
                    expect(sends).toHaveLength(2);
                });
                finishSend('tx2');
                await expect(next).resolves.toEqual({ transactionId: 'tx2' });
            });
        });

        describe('one tapplet send at a time', () => {
            const L2_REQ = [{ amount: '100', address: ADDRESS, payRef: PAY_REF }];
            const L1_REQ = [{ amount: '100', address: 'tari-address' }];

            it('refuses an L2 send while an L1 send waits on its PIN prompt, and the other way round', async () => {
                let finish: (value: unknown) => void = () => undefined;
                vi.mocked(invoke).mockImplementation((async (cmd: string) => {
                    if (cmd === 'l2_get_state') return l2State();
                    if (cmd === 'send_one_sided_to_stealth_address' || cmd === 'l2_send_from_tapplet') {
                        return new Promise((resolve) => (finish = resolve));
                    }
                    return null;
                }) as typeof invoke);

                const l1 = signer.runOne('sendOneSided', L1_REQ);
                await expect(signer.runOne('sendOotleStealth', L2_REQ)).rejects.toThrow(/^busy$/);
                finish(undefined);
                await expect(l1).resolves.toBe(true);

                const l2 = signer.runOne('sendOotleStealth', L2_REQ);
                await vi.waitFor(() => expect(invoke).toHaveBeenCalledWith('l2_send_from_tapplet', expect.anything()));
                await expect(signer.runOne('sendOneSided', L1_REQ)).rejects.toThrow(/^busy$/);
                finish('tx1');
                await expect(l2).resolves.toEqual({ transactionId: 'tx1' });
            });

            it.each([
                ['sendOotleStealth', L2_REQ, 'l2_send_from_tapplet'],
                ['sendOneSided', L1_REQ, 'send_one_sided_to_stealth_address'],
            ] as const)('refuses tapplet sends for a while after %s is denied', async (method, req, command) => {
                vi.useFakeTimers();
                mockCommands({
                    l2_get_state: l2State(),
                    l2_validate_address: null,
                    [command]: new Error('PIN entry cancelled'),
                });

                await signer.runOne(method, req).catch(() => undefined);
                await expect(signer.runOne('sendOotleStealth', L2_REQ)).rejects.toThrow(/^busy$/);
                await expect(signer.runOne('sendOneSided', L1_REQ)).rejects.toThrow(/^busy$/);

                await vi.advanceTimersByTimeAsync(10_000);
                mockCommands({ l2_get_state: l2State(), l2_validate_address: null, l2_send_from_tapplet: 'tx9' });
                await expect(signer.runOne('sendOotleStealth', L2_REQ)).resolves.toEqual({ transactionId: 'tx9' });
            });

            /** Answers the next L2 send with `result`: a transaction id, or an Error to throw. */
            function nextL2Send(result: string | Error) {
                mockCommands({ l2_get_state: l2State(), l2_validate_address: null, l2_send_from_tapplet: result });
                return signer.runOne('sendOotleStealth', L2_REQ).catch((e: Error) => e.message);
            }

            /** How long sends stay refused, to the second. Probes with a locked wallet, which neither sends nor cools down. */
            async function cooldownSecs(): Promise<number> {
                mockCommands({ l2_get_state: l2State({ locked: true, accounts: [] }) });
                for (let secs = 0; secs <= 400; secs++) {
                    const busy = await signer
                        .runOne('sendOotleStealth', L2_REQ)
                        .then(() => false)
                        .catch((e: Error) => e.message === 'busy');
                    if (!busy) return secs;
                    await vi.advanceTimersByTimeAsync(1_000);
                }
                throw new Error('cooldown never ended');
            }

            it('doubles the denial cooldown up to five minutes and resets it after a send', async () => {
                vi.useFakeTimers();
                const cooldowns: number[] = [];
                for (let i = 0; i < 7; i++) {
                    await nextL2Send(new Error('PIN entry cancelled'));
                    cooldowns.push(await cooldownSecs());
                }
                expect(cooldowns).toEqual([10, 20, 40, 80, 160, 300, 300]);

                await expect(nextL2Send('tx1')).resolves.toEqual({ transactionId: 'tx1' });
                await nextL2Send(new Error('PIN entry cancelled'));
                expect(await cooldownSecs()).toBe(10);
            });

            it('starts the denial cooldown over after five quiet minutes', async () => {
                vi.useFakeTimers();
                await nextL2Send(new Error('PIN entry cancelled'));
                expect(await cooldownSecs()).toBe(10);
                await nextL2Send(new Error('PIN entry cancelled'));
                expect(await cooldownSecs()).toBe(20);

                // Just short of five quiet minutes the count still stands...
                await vi.advanceTimersByTimeAsync(299_000);
                await nextL2Send(new Error('PIN entry cancelled'));
                expect(await cooldownSecs()).toBe(40);

                // ...after them it starts over.
                await vi.advanceTimersByTimeAsync(300_000);
                await nextL2Send(new Error('PIN entry cancelled'));
                expect(await cooldownSecs()).toBe(10);
            });

            it.each([
                ['sendOotleStealth', L2_REQ, 'l2_send_from_tapplet'],
                ['sendOneSided', L1_REQ, 'send_one_sided_to_stealth_address'],
            ] as const)(
                'refuses sends for 3 s after %s fails, without growing the denial cooldown',
                async (method, req, command) => {
                    vi.useFakeTimers();
                    await nextL2Send(new Error('PIN entry cancelled'));
                    expect(await cooldownSecs()).toBe(10);

                    mockCommands({
                        l2_get_state: l2State(),
                        l2_validate_address: null,
                        [command]: new Error('indexer down'),
                    });
                    await signer.runOne(method, req).catch(() => undefined);
                    expect(await cooldownSecs()).toBe(3);

                    await nextL2Send(new Error('PIN entry cancelled'));
                    expect(await cooldownSecs()).toBe(20);
                }
            );
        });

        describe('waitOotleTransaction', () => {
            /** Sends through the signer so it knows the ids, then clears the mock's call log. */
            async function sendTransactions(...ids: string[]) {
                for (const id of ids) {
                    mockCommands({ l2_get_state: l2State(), l2_validate_address: null, l2_send_from_tapplet: id });
                    await signer.runOne('sendOotleStealth', [{ amount: '100', address: ADDRESS, payRef: PAY_REF }]);
                }
                vi.mocked(invoke).mockClear();
            }

            beforeEach(async () => {
                await sendTransactions('tx1', 'tx2', 'tx3', 'tx4', 'tx5');
            });

            it('refuses ids this signer did not send', async () => {
                mockCommands({ l2_get_state: l2State({}, 'Accepted') });

                await expect(
                    signer.runOne('waitOotleTransaction', [{ transactionId: 'someone-elses-tx', timeoutSecs: 30 }])
                ).rejects.toThrow('Invalid arguments for tapplet signer method: waitOotleTransaction');
                expect(invoke).not.toHaveBeenCalled();
            });

            it('returns the settled status', async () => {
                mockCommands({ l2_get_state: l2State({}, 'Accepted') });

                await expect(
                    signer.runOne('waitOotleTransaction', [{ transactionId: 'tx1', timeoutSecs: 30 }])
                ).resolves.toEqual({ status: 'Accepted' });
            });

            it.each(['New', 'DryRun', 'DryRunFailed', 'SomethingNew'])(
                'keeps polling through the non-final status %s',
                async (interim) => {
                    vi.useFakeTimers();
                    let status = interim;
                    vi.mocked(invoke).mockImplementation((async (_cmd: string) =>
                        l2State({}, status)) as typeof invoke);

                    const result = signer.runOne('waitOotleTransaction', [{ transactionId: 'tx1', timeoutSecs: 30 }]);
                    await vi.advanceTimersByTimeAsync(4_500);
                    status = 'Rejected';
                    await vi.advanceTimersByTimeAsync(2_000);

                    await expect(result).resolves.toEqual({ status: 'Rejected' });
                }
            );

            it('reports Pending once the timeout runs out', async () => {
                vi.useFakeTimers();
                mockCommands({ l2_get_state: l2State({}, 'Pending') });

                const result = signer.runOne('waitOotleTransaction', [{ transactionId: 'tx1', timeoutSecs: 5 }]);
                await vi.advanceTimersByTimeAsync(6_000);

                await expect(result).resolves.toEqual({ status: 'Pending' });
            });

            it('joins a repeat wait on the same id and polls once per interval', async () => {
                vi.useFakeTimers();
                let status = 'Pending';
                vi.mocked(invoke).mockImplementation((async (_cmd: string) => l2State({}, status)) as typeof invoke);
                const wait = () => signer.runOne('waitOotleTransaction', [{ transactionId: 'tx1', timeoutSecs: 30 }]);

                const first = wait();
                const second = wait();
                await vi.advanceTimersByTimeAsync(4_500);
                // Polls at 0, 2 and 4 seconds: one wait, not two.
                expect(invoke).toHaveBeenCalledTimes(3);

                status = 'Accepted';
                await vi.advanceTimersByTimeAsync(2_000);
                await expect(first).resolves.toEqual({ status: 'Accepted' });
                await expect(second).resolves.toEqual({ status: 'Accepted' });
                expect(invoke).toHaveBeenCalledTimes(4);
            });

            it('delays a new wait for an id until 5 s after its last one ended, joining repeat calls', async () => {
                vi.useFakeTimers();
                mockCommands({ l2_get_state: l2State({}, 'Pending') });
                const wait = (timeoutSecs: number) =>
                    signer.runOne('waitOotleTransaction', [{ transactionId: 'tx1', timeoutSecs }]);

                const timedOut = wait(1);
                await vi.advanceTimersByTimeAsync(2_000);
                await expect(timedOut).resolves.toEqual({ status: 'Pending' });
                vi.mocked(invoke).mockClear();

                mockCommands({ l2_get_state: l2State({}, 'Accepted') });
                const retry = wait(30);
                const duplicate = wait(30);
                // The first wait ended at 2 s, so the retry starts polling at 7 s.
                await vi.advanceTimersByTimeAsync(4_500);
                expect(invoke).not.toHaveBeenCalled();
                await vi.advanceTimersByTimeAsync(1_000);
                await expect(retry).resolves.toEqual({ status: 'Accepted' });
                await expect(duplicate).resolves.toEqual({ status: 'Accepted' });
                expect(invoke).toHaveBeenCalledTimes(1);
            });

            it('retries straight after a wait that could not read the L2 state, after the delay', async () => {
                vi.useFakeTimers();
                mockCommands({ l2_get_state: new Error('store busy') });
                const wait = () => signer.runOne('waitOotleTransaction', [{ transactionId: 'tx1', timeoutSecs: 30 }]);

                await expect(wait()).resolves.toEqual(L2_UNAVAILABLE);
                mockCommands({ l2_get_state: l2State({}, 'Accepted') });
                const retry = wait();
                await vi.advanceTimersByTimeAsync(4_000);
                expect(invoke).toHaveBeenCalledTimes(1);
                await vi.advanceTimersByTimeAsync(1_000);
                await expect(retry).resolves.toEqual({ status: 'Accepted' });
                expect(invoke).toHaveBeenCalledTimes(2);
            });

            it('refuses a fifth distinct id while four are waited on, then frees the slots', async () => {
                vi.useFakeTimers();
                mockCommands({ l2_get_state: l2State({}, 'Pending') });
                const wait = (transactionId: string) =>
                    signer.runOne('waitOotleTransaction', [{ transactionId, timeoutSecs: 5 }]);

                const waits = ['tx1', 'tx2', 'tx3', 'tx4'].map(wait);
                await expect(wait('tx5')).rejects.toThrow(/^busy$/);

                await vi.advanceTimersByTimeAsync(6_000);
                await Promise.all(waits);
                const again = wait('tx5');
                await vi.advanceTimersByTimeAsync(6_000);
                await expect(again).resolves.toEqual({ status: 'Pending' });
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
                [[{ transactionId: 'x'.repeat(301), timeoutSecs: 30 }]],
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
