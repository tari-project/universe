import { TappletProvider, TappletProviderParams } from '@app/types/tapplets/TappletProvider.ts';
import { create } from './create.ts';
import { setError } from './index.ts';
import { ActiveTapplet } from '@app/types/tapplets/tapplet.ts';
import { TransactionEvent } from '@app/types/tapplets/transaction.ts';

interface State {
    isInitialized: boolean;
    tappletProvider?: TappletProvider;
}

//TODO do we need tapp provider id at all?
interface Actions {
    initTappletProvider: () => Promise<void>;
    setTappletProvider: (id: string, launchedTapplet: ActiveTapplet) => Promise<void>;
    runTransaction: (event: MessageEvent<TransactionEvent>) => Promise<void>;
}

type TappletProviderStoreState = State & Actions;

const initialState: State = {
    isInitialized: false,
    tappletProvider: undefined,
};

export const useTappletProviderStore = create<TappletProviderStoreState>()((set, get) => ({
    ...initialState,

    initTappletProvider: async () => {
        try {
            console.info(`🌎️ [TU store][init provider]`);

            const params: TappletProviderParams = {
                id: 'provider',
            };
            const provider: TappletProvider = TappletProvider.build(params);

            set({ isInitialized: true, tappletProvider: provider });
        } catch (error) {
            console.error('Error setting tapplet provider: ', error);
            setError(`Error setting tapplet provider: ${error}`);
        }
    },
    setTappletProvider: async (id: string) => {
        try {
            const params: TappletProviderParams = {
                id,
            };
            const provider: TappletProvider = TappletProvider.build(params);

            set({ isInitialized: true, tappletProvider: provider });
        } catch (error) {
            console.error('Error setting tapplet provider: ', error);
            setError(`Error setting tapplet provider: ${error}`);
        }
    },
    runTransaction: async (event: MessageEvent<TransactionEvent>) => {
        const { methodName, args, id } = event.data;
        try {
            const provider = get().tappletProvider;
            const result = await provider?.runOne(methodName, args);
            if (event.source) {
                event.source.postMessage({ id, result, type: 'provider-call' }, { targetOrigin: event.origin });
            }
        } catch (error) {
            console.error(`Error running method "${String(methodName)}": ${error}`);
            setError(`Error running method "${String(methodName)}": ${error}`);
        }
    },
}));
