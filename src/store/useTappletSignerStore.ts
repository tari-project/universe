import { create } from 'zustand';
import { TappletSigner } from '@app/types/tapplets/TappletSigner.ts';
import { setError } from './actions/appStateStoreActions.ts';
import { TransactionEvent } from '@app/types/tapplets/transaction.ts';
import { TappletSignerParams } from '@app/types/tapplets/tapplet.types.ts';

interface State {
    isInitialized: boolean;
    tappletSigner?: TappletSigner;
}

interface Actions {
    initTappletSigner: () => Promise<void>;
    setTappletSigner: (id: string) => Promise<void>;
    runTransaction: (event: MessageEvent<TransactionEvent>) => Promise<void>;
}

type TappletSignerStoreState = State & Actions;

const initialState: State = {
    isInitialized: false,
    tappletSigner: undefined,
};

export const useTappletSignerStore = create<TappletSignerStoreState>()((set, get) => ({
    ...initialState,

    initTappletSigner: async () => {
        try {
            if (get().isInitialized) return;

            const params: TappletSignerParams = {
                id: 'default',
            };
            const provider: TappletSigner = TappletSigner.build(params);

            set({ isInitialized: true, tappletSigner: provider });
        } catch (error) {
            console.error('Error initializing tapplet provider: ', error);
            setError(`Error initializing tapplet provider: ${error}`);
        }
    },
    setTappletSigner: async (id: string) => {
        try {
            if (get().tappletSigner?.id == id) return;
            const params: TappletSignerParams = {
                id,
            };
            const provider: TappletSigner = TappletSigner.build(params);

            set({ isInitialized: true, tappletSigner: provider });
        } catch (error) {
            console.error('Error setting tapplet provider: ', error);
            setError(`Error setting tapplet provider: ${error}`);
        }
    },
    runTransaction: async (event: MessageEvent<TransactionEvent>) => {
        const { methodName, args, id } = event.data;
        try {
            const provider = get().tappletSigner;
            const result = await provider?.runOne(methodName, args);
            if (event.source) {
                event.source.postMessage({ id, result, type: 'signer-call' }, { targetOrigin: event.origin });
            }
        } catch (error) {
            console.error(`Error running method "${String(methodName)}": ${error}`);
            setError(`Error running method "${String(methodName)}": ${error}`);
        }
    },
}));
