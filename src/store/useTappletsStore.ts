import { create } from './create.ts';
import { ActiveTapplet, BuiltInTapplet, TappletConfig } from '@app/types/tapplets/tapplet.ts';
import { useTappletProviderStore } from './useTappletProviderStore.ts';
import { invoke } from '@tauri-apps/api/core';

export const TAPPLET_CONFIG_FILE = 'tapplet.config.json'; //TODO

interface State {
    isInitialized: boolean;
    isFetching: boolean;
    activeTapplet: ActiveTapplet | undefined;
}

interface Actions {
    setActiveTapp: (tapplet?: ActiveTapplet) => Promise<void>;
    setActiveTappById: (tappletId: number, isBuiltIn?: boolean) => Promise<void>;
    deactivateTapplet: () => Promise<void>;
}

type TappletsStoreState = State & Actions;

export const BRIDGE_TAPPLET_ID = 0; //TODO

const initialState: State = {
    isFetching: false,
    isInitialized: false,
    activeTapplet: undefined,
};

export const useTappletsStore = create<TappletsStoreState>()((set, get) => ({
    ...initialState,

    setActiveTapp: async (tapplet) => {
        set({ activeTapplet: tapplet });
    },
    deactivateTapplet: async () => {
        set({ activeTapplet: undefined });
    },
    setActiveTappById: async (tappletId, isBuiltIn = false) => {
        console.info('SET ACTIVE TAP', tappletId, get().activeTapplet?.tapplet_id);
        if (tappletId == get().activeTapplet?.tapplet_id) return;
        const tappProviderState = useTappletProviderStore.getState();
        //TODO path
        const tappletDestDir = '/home/oski/.cache/com.tari.universe.alpha/tapplets/bridge/esmeralda';
        // built-in tapplet
        if (isBuiltIn) {
            const activeTapplet = await invoke('launch_builtin_tapplet', { tappletDestDir: tappletDestDir });
            set({ activeTapplet });
            // TODO change provider name
            tappProviderState.setTappletProvider('builtInProvider', activeTapplet);
            return;
        }

        return;
    },
}));
