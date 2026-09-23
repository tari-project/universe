import { create } from 'zustand';
import { TappletSigner } from '@app/types/tapplets/TappletSigner.ts';
import { setError } from './actions/appStateStoreActions.ts';
import { TransactionEvent } from '@app/types/tapplets/transaction.ts';
import { TappletSignerParams } from '@app/types/tapplets/tapplet.types.ts';

interface TappletSignerStoreState {
    isInitialized: boolean;
    tappletSigner?: TappletSigner;
}

const initialState: TappletSignerStoreState = {
    isInitialized: false,
    tappletSigner: undefined,
};

export const useTappletSignerStore = create<TappletSignerStoreState>()(() => ({ ...initialState }));

export const initTappletSigner = async () => {
    if (useTappletSignerStore.getState().isInitialized) return;
    try {
        const params: TappletSignerParams = { id: 'default' };
        const provider: TappletSigner = TappletSigner.build(params);
        if (provider) {
            useTappletSignerStore.setState({ isInitialized: true, tappletSigner: provider });
        }
    } catch (error) {
        console.error('Error initializing tapplet provider: ', error);
        setError(`Error initializing tapplet provider: ${error}`);
    }
};

/**
 * The sender of the message is validated by the tapplet iframe host (see `Tapplet.tsx`); this is a
 * second line of defence that makes sure a malformed payload never reaches the signer.
 */
function isSignerCallPayload(data: unknown): data is TransactionEvent {
    if (!data || typeof data !== 'object') return false;
    const payload = data as Record<string, unknown>;
    return (
        typeof payload.methodName === 'string' &&
        Array.isArray(payload.args) &&
        payload.id !== undefined &&
        payload.id !== null
    );
}

export const runTappletTransaction = async (event: MessageEvent<TransactionEvent>) => {
    const provider = useTappletSignerStore.getState().tappletSigner;
    if (!provider) return;

    if (!isSignerCallPayload(event.data)) {
        console.warn('Ignoring malformed tapplet signer-call message');
        return;
    }

    const { id, methodName, args } = event.data;
    try {
        const result = await provider.runOne(methodName, args);
        if (event.source) {
            event.source.postMessage({ id, result, type: 'signer-call' }, { targetOrigin: event.origin });
        }
    } catch (error) {
        console.error(`Error running method "${String(methodName)}": ${error}`);
        setError(`Error running method "${String(methodName)}": ${error}`);
        // Let the tapplet settle its pending request instead of hanging on it forever.
        event.source?.postMessage({ id, resultError: `${error}`, type: 'signer-call' }, { targetOrigin: event.origin });
    }
};
