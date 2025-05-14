import { create } from './create.ts';
import { ActiveTapplet } from '@app/types/tapplets/tapplet.ts';
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
        // built-in tapplet
        if (isBuiltIn) {
            const tappletDestDir = '/home/oski/.cache/com.tari.universe.alpha/tapplets/bridge/esmeralda';
            const activeTapplet = await invoke('launch_builtin_tapplet', { tappletDestDir: tappletDestDir });
            set({ activeTapplet });
            // TODO change provider name
            tappProviderState.setTappletProvider('builtInProvider', activeTapplet);
            return;
        }

        // dev
        // TODO tmp mock
        // const bridgeTapplet: BuiltInTapplet = {
        //     id: 0,
        //     version: '0.1.0',
        //     display_name: 'WXTM Bridge',
        //     endpoint: 'http://localhost:3000',
        //     destDir: '/home/oski/.cache/com.tari.universe.alpha/tapplets/bridge/esmeralda',
        // };

        // if (isBuiltIn) {
        //TODO tmp solution - change to `config` data if built-in tapplet has config
        //     const activeTapplet: ActiveTapplet = {
        //         tapplet_id: bridgeTapplet.id,
        //         version: bridgeTapplet.version,
        //         source: bridgeTapplet.endpoint,
        //         display_name: bridgeTapplet.display_name ?? '',
        //         supportedChain: ['MAINNET', 'STAGENET', 'NEXTNET'],
        //     };
        //     set({ activeTapplet });
        //     tappProviderState.setTappletProvider('builtInProvider', activeTapplet);
        //     return;
        // }

        return;
    },
}));
