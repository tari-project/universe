import { create } from './create.ts';
import { ActiveTapplet } from '@app/types/ootle/tapplet.ts';
import { useAppStateStore } from './appStateStore.ts';
import { TappletProvider, TappletProviderParams } from '@app/types/ootle/TappletProvider.ts';
import { toPermission } from '@app/types/ootle/tariPermissions.ts';
import { TransactionEvent } from '@app/types/ootle/transaction.ts';
import { TariPermissions } from '@tari-project/tari-permissions';

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
                id: '0',
                permissions: { requiredPermissions: [], optionalPermissions: [] },
            };
            const provider: TappletProvider = TappletProvider.build(params);

            set({ isInitialized: true, tappletProvider: provider });
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            console.error('Error setting tapplet provider: ', error);
            appStateStore.setError(`Error setting tapplet provider: ${error}`);
        }
    },
    setTappletProvider: async (id: string, launchedTapplet: ActiveTapplet) => {
        try {
            // TODO tmp solution
            const requiredPermissions = new TariPermissions();
            const optionalPermissions = new TariPermissions();
            if (launchedTapplet.permissions) {
                launchedTapplet.permissions.requiredPermissions.map((p) =>
                    requiredPermissions.addPermission(toPermission(p))
                );
                launchedTapplet.permissions.optionalPermissions.map((p) =>
                    optionalPermissions.addPermission(toPermission(p))
                );
            }
            const params: TappletProviderParams = {
                id,
                permissions: launchedTapplet.permissions ?? { requiredPermissions: [], optionalPermissions: [] },
            };
            const provider: TappletProvider = TappletProvider.build(params);

            set({ isInitialized: true, tappletProvider: provider });
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            console.error('Error setting tapplet provider: ', error);
            appStateStore.setError(`Error setting tapplet provider: ${error}`);
        }
    },
    runTransaction: async (event: MessageEvent<TransactionEvent>) => {
        const { methodName, args, id } = event.data;
        try {
            const provider = get().tappletProvider;
            console.info(`🌎️ [TU store][run tx] Running method "${methodName}"`);
            const result = await provider?.runOne(methodName, args);
            if (event.source) {
                event.source.postMessage({ id, result, type: 'provider-call' }, { targetOrigin: event.origin });
            }
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            console.error(`Error running method "${methodName}": ${error}`);
            appStateStore.setError(`Error running method "${methodName}": ${error}`);
        }
    },
}));
