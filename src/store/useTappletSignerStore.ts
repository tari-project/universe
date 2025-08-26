import { TappletSigner } from '@app/types/tapplets/TappletSigner.ts';
import { create } from './create.ts';
import { setError } from './index.ts';
import { TransactionEvent } from '@app/types/tapplets/transaction.ts';
import { TappletSignerParams } from '@app/types/tapplets/tapplet.types.ts';
import { MessageType } from '@app/hooks/swap/useIframeMessage.ts';

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
                permissions: { requiredPermissions: [], optionalPermissions: [] },
            };
            const signer: TappletSigner = TappletSigner.build(params);

            set({ isInitialized: true, tappletSigner: signer });
        } catch (error) {
            console.error('Error initializing tapplet signer: ', error);
            setError(`Error initializing tapplet signer: ${error}`);
        }
    },
    setTappletSigner: async (id: string) => {
        try {
            if (get().tappletSigner?.id == id) return;
            const params: TappletSignerParams = {
                id,
                permissions: { requiredPermissions: [], optionalPermissions: [] },
            };
            const signer: TappletSigner = TappletSigner.build(params);

            set({ isInitialized: true, tappletSigner: signer });
        } catch (error) {
            console.error('Error setting tapplet signer: ', error);
            setError(`Error setting tapplet signer: ${error}`);
        }
    },
    runTransaction: async (event: MessageEvent<TransactionEvent>) => {
        console.warn(`🐼 Running L2 method :`, { event });
        const { methodName, args, id } = event.data.payload;

        try {
            const signer = get().tappletSigner;
            const result = await signer?.runOne(methodName, args);
            if (event.source) {
                event.source.postMessage({ id, result, type: MessageType.SIGNER_CALL }, { targetOrigin: event.origin });
            }
        } catch (error) {
            console.error(`Error running method "${String(methodName)}": ${error}`);
            setError(`Error running method "${String(methodName)}": ${error}`);
        }
    },
}));
