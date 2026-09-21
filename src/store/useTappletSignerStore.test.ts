import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({
        onCloseRequested: vi.fn(),
        listen: vi.fn(),
    })),
}));

import { runTappletTransaction, useTappletSignerStore } from './useTappletSignerStore';
import { TappletSigner } from '@app/types/tapplets/TappletSigner';
import { TransactionEvent } from '@app/types/tapplets/transaction';

const TAPPLET_ORIGIN = 'http://127.0.0.1:41234';

const runOne = vi.fn().mockResolvedValue('result');
const postMessage = vi.fn();

function signerCallEvent(data: unknown) {
    return {
        data,
        origin: TAPPLET_ORIGIN,
        source: { postMessage },
    } as unknown as MessageEvent<TransactionEvent>;
}

describe('runTappletTransaction', () => {
    beforeEach(() => {
        runOne.mockClear();
        postMessage.mockClear();
        vi.spyOn(console, 'warn')
            .mockImplementation(() => undefined)
            .mockClear();
        useTappletSignerStore.setState({
            isInitialized: true,
            tappletSigner: { runOne } as unknown as TappletSigner,
        });
    });

    it('dispatches a well formed signer call and replies to the sender', async () => {
        await runTappletTransaction(signerCallEvent({ id: 7, methodName: 'getAccount', args: [] }));

        expect(runOne).toHaveBeenCalledWith('getAccount', []);
        expect(postMessage).toHaveBeenCalledWith(
            { id: 7, result: 'result', type: 'signer-call' },
            { targetOrigin: TAPPLET_ORIGIN }
        );
    });

    it.each([
        [undefined],
        [null],
        ['getAccount'],
        [{ id: 1, args: [] }],
        [{ id: 1, methodName: 42, args: [] }],
        [{ id: 1, methodName: 'getAccount' }],
        [{ id: 1, methodName: 'getAccount', args: 'all of them' }],
        [{ methodName: 'getAccount', args: [] }],
    ])('ignores the malformed payload %j', async (data) => {
        await runTappletTransaction(signerCallEvent(data));

        expect(runOne).not.toHaveBeenCalled();
        expect(postMessage).not.toHaveBeenCalled();
    });

    it('does nothing when no signer is initialized', async () => {
        useTappletSignerStore.setState({ isInitialized: false, tappletSigner: undefined });

        await runTappletTransaction(signerCallEvent({ id: 1, methodName: 'getAccount', args: [] }));

        expect(postMessage).not.toHaveBeenCalled();
    });

    it('lets the tapplet settle its request when the call throws', async () => {
        runOne.mockRejectedValueOnce(new Error('boom'));

        await runTappletTransaction(signerCallEvent({ id: 3, methodName: 'getAccount', args: [] }));

        expect(postMessage).toHaveBeenCalledWith(
            { id: 3, resultError: 'Error: boom', type: 'signer-call' },
            { targetOrigin: TAPPLET_ORIGIN }
        );
    });
});
