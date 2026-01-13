import { create } from 'zustand';
import { TappletSigner } from '@app/types/tapplets/TappletSigner.ts';
import { setError } from './actions/appStateStoreActions.ts';
import { TransactionEvent } from '@app/types/tapplets/transaction.ts';
import { TappletSignerParams } from '@app/types/tapplets/tapplet.types.ts';

interface State {
    isInitialized: boolean;
    tappletSigner?: TappletSigner;
}

type TappletSignerStoreState = State;

const initialState: State = {
    isInitialized: false,
    tappletSigner: undefined,
};

export const useTappletSignerStore = create<TappletSignerStoreState>()(() => ({
    ...initialState,
}));

export const initTappletSigner = async () => {
    try {
        if (useTappletSignerStore.getState().isInitialized) return;
        const params: TappletSignerParams = { id: 'default' };
        const provider: TappletSigner = TappletSigner.build(params);
        useTappletSignerStore.setState({ isInitialized: true, tappletSigner: provider });
    } catch (error) {
        console.error('Error initializing tapplet provider: ', error);
        setError(`Error initializing tapplet provider: ${error}`);
    }
};

export const runTransaction = async (evt: MessageEvent<TransactionEvent>) => {
    const { methodName, args, id } = evt.data;
    try {
        const provider = useTappletSignerStore.getState().tappletSigner;
        const result = await provider?.runOne(methodName, args);
        if (evt.source) {
            evt.source.postMessage({ id, result, type: 'signer-call' }, { targetOrigin: evt.origin });
        }
    } catch (error) {
        console.error(`Error running method "${String(methodName)}": ${error}`);
        setError(`Error running method "${String(methodName)}": ${error}`);
    }
};
