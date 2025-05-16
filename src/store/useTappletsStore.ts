import { create } from './create.ts';
import { ActiveTapplet } from '@app/types/tapplets/tapplet.ts';
import { useTappletProviderStore } from './useTappletProviderStore.ts';
import { invoke } from '@tauri-apps/api/core';
import { FEATURES } from './consts.ts';
import { fetchFeatureFlag } from './actions/airdropStoreActions.ts';

export const TAPPLET_CONFIG_FILE = 'tapplet.config.json'; //TODO

interface State {
    isInitialized: boolean;
    isFetching: boolean;
    activeTapplet: ActiveTapplet | undefined;
    uiBridgeSwapsEnabled: boolean;
}

interface Actions {
    setActiveTapp: (tapplet?: ActiveTapplet) => Promise<void>;
    setActiveTappById: (tappletId: number, isBuiltIn?: boolean) => Promise<void>;
    deactivateTapplet: () => Promise<void>;
    setUiBridgeSwaps: (enabled: boolean) => Promise<void>;
    fetchUiBridgeFeatureFlag: () => Promise<boolean>;
}

type TappletsStoreState = State & Actions;

const initialState: State = {
    isFetching: false,
    isInitialized: false,
    activeTapplet: undefined,
    uiBridgeSwapsEnabled: false,
};

export const useTappletsStore = create<TappletsStoreState>()((set, get) => ({
    ...initialState,
    setUiBridgeSwaps: async (enabled: boolean) => {
        set({ uiBridgeSwapsEnabled: enabled });
    },
    fetchUiBridgeFeatureFlag: async () => {
        const response = await fetchFeatureFlag(FEATURES.FF_UI_BRIDGE);
        const uiBridgeFlag = response?.access ?? false;
        set({ uiBridgeSwapsEnabled: uiBridgeFlag });
        return uiBridgeFlag;
    },
    setActiveTapp: async (tapplet) => {
        set({ activeTapplet: tapplet });
    },
    deactivateTapplet: async () => {
        set({ activeTapplet: undefined });
    },
    setActiveTappById: async (tappletId, isBuiltIn = false) => {
        if (tappletId == get().activeTapplet?.tapplet_id) return;
        const tappProviderState = useTappletProviderStore.getState();
        if (!tappProviderState.isInitialized) tappProviderState.initTappletProvider();
        // built-in tapplet
        if (isBuiltIn) {
            const activeTapplet = await invoke('launch_builtin_tapplet');
            set({ activeTapplet });
            return;
        }
        return;
    },
}));
