import { create } from './create.ts';
import { ActiveTapplet, BuiltInTapplet, TappletConfig } from '@app/types/tapplets/tapplet.ts';
import { useTappletProviderStore } from './useTappletProviderStore.ts';

export const TAPPLET_CONFIG_FILE = 'tapplet.config.json'; //TODO

interface State {
    isInitialized: boolean;
    isFetching: boolean;
    builtInTapplets: BuiltInTapplet[];
    activeTapplet: ActiveTapplet | undefined;
}

interface Actions {
    setActiveTapp: (tapplet?: ActiveTapplet) => Promise<void>;
    setActiveTappById: (tappletId: number, isBuiltIn?: boolean) => Promise<void>;
    deactivateTapplet: () => Promise<void>;
}

type TappletsStoreState = State & Actions;

export const BRIDGE_TAPPLET_ID = 0; //TODO
const bridgeTapplet: BuiltInTapplet = {
    id: BRIDGE_TAPPLET_ID,
    endpoint: 'http://localhost:3000',
    display_name: 'Bridge XTM',
};

const initialState: State = {
    isFetching: false,
    isInitialized: false,
    builtInTapplets: [bridgeTapplet],
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
    setActiveTappById: async (tappletId, isBuiltIn = true) => {
        console.info('SET ACTIVE TAP', tappletId, get().activeTapplet?.tapplet_id);
        if (tappletId == get().activeTapplet?.tapplet_id) return;
        const tappProviderState = useTappletProviderStore.getState();
        // built-in tapplet
        if (isBuiltIn) {
            const tapplet = get().builtInTapplets.find((tapp) => tapp.id === tappletId);
            if (!tapplet) return;
            // TODO uncomment if built-in tapplet has config
            // const resp = await fetch(`${tapplet.endpoint}/${TAPPLET_CONFIG_FILE}`);
            // console.info('Dev Tapplet config', resp);
            // if (!resp.ok) return;
            // const config: TappletConfig = await resp.json();
            // console.info('Dev Tapplet config', config);
            // if (!config) return;
            const activeTapplet: ActiveTapplet = {
                tapplet_id: tapplet.id,
                version: '0.1.0', //TODO tmp solution - change to `config.version` if built-in tapplet has config
                source: tapplet.endpoint,
                display_name: tapplet.display_name ?? '',
                supportedChain: ['MAINNET', 'STAGENET', 'NEXTNET'], //TODO tmp solution - change to `config.supportedChain` if built-in tapplet has config
            };
            set({ activeTapplet });
            tappProviderState.setTappletProvider('builtInProvider', activeTapplet);
            return;
        }

        // if not built-in tapplet launch here
        return;
    },
}));
