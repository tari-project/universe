import { invoke } from '@tauri-apps/api';
import { create } from './create.ts';
import { LaunchedTappResult } from '@app/types/ootle/tapplet.ts';
import { useAppStateStore } from './appStateStore.ts';
import { TappletProvider, TappletProviderParams } from '@app/types/ootle/TappletProvider.ts';
import { TariPermissions } from '@tari-project/tarijs';
import { toPermission } from '@app/types/ootle/tariPermissions.ts';

interface State {
    isInitialized: boolean;
    tappletProvider?: TappletProvider;
}

interface Actions {
    setTappletProvider: (id: string, launchedTappParams: LaunchedTappResult) => Promise<void>;
}

type TappletProviderStoreState = State & Actions;

const initialState: State = {
    isInitialized: false,
    tappletProvider: undefined,
};

export const useTappletProviderStore = create<TappletProviderStoreState>()((set) => ({
    ...initialState,
    setTappletProvider: async (id: string, launchedTappParams: LaunchedTappResult) => {
        console.log('[STORE][tapp provider] set tapp', launchedTappParams);
        try {
            // TODO tmp solution
            const requiredPermissions = new TariPermissions();
            const optionalPermissions = new TariPermissions();
            if (launchedTappParams.permissions) {
                launchedTappParams.permissions.requiredPermissions.map((p) =>
                    requiredPermissions.addPermission(toPermission(p))
                );
                launchedTappParams.permissions.optionalPermissions.map((p) =>
                    optionalPermissions.addPermission(toPermission(p))
                );
            }
            const params: TappletProviderParams = {
                id,
                permissions: launchedTappParams.permissions,
            };
            const provider: TappletProvider = TappletProvider.build(params);

            set({ isInitialized: true, tappletProvider: provider });
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            console.error('Error setting tapplet provider: ', error);
            appStateStore.setError(`Error setting tapplet provider: ${error}`);
        }
    },
}));
