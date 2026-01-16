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

export const runTappletTransaction = async (event: MessageEvent<TransactionEvent>) => {
    const provider = useTappletSignerStore.getState().tappletSigner;
    if (!provider) return;

    try {
        const result = await provider?.runOne(event.data.methodName, event.data.args);
        if (event.source) {
            event.source.postMessage(
                { id: event.data.id, result, type: 'signer-call' },
                { targetOrigin: event.origin }
            );
        }
    } catch (error) {
        console.error(`Error running method "${String(event.data.methodName)}": ${error}`);
        setError(`Error running method "${String(event.data.methodName)}": ${error}`);
    }
};
