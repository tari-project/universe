import { create } from './create.ts';
import { ActiveTapplet, BridgeTxDetails } from '@app/types/tapplets/tapplet.types.ts';
import { useTappletSignerStore } from './useTappletSignerStore.ts';
import { invoke } from '@tauri-apps/api/core';

interface State {
    isInitialized: boolean;
    isFetching: boolean;
    activeTapplet: ActiveTapplet | undefined;
    ongoingBridgeTx: BridgeTxDetails | undefined;
    isPendingTappletTx: boolean;
}

interface Actions {
    setActiveTapp: (tapplet?: ActiveTapplet) => Promise<void>;
    setActiveTappById: (tappletId: number, isBuiltIn?: boolean) => Promise<void>;
    setDevTapplet: (tappPath: string) => Promise<void>;
    deactivateTapplet: () => Promise<void>;
    setOngoingBridgeTx: (tx: BridgeTxDetails) => void;
    removeOngoingBridgeTx: () => void;
}

type TappletsStoreState = State & Actions;

const initialState: State = {
    isFetching: false,
    isInitialized: false,
    activeTapplet: undefined,

    ongoingBridgeTx: undefined,
    isPendingTappletTx: false,
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
        if (tappletId == get().activeTapplet?.tapplet_id) return;
        const tappProviderState = useTappletSignerStore.getState();
        if (!tappProviderState.isInitialized) tappProviderState.initTappletSigner();

        // built-in tapplet
        if (isBuiltIn) {
            const activeTapplet = await invoke('launch_builtin_tapplet');
            set({ activeTapplet });
            return;
        }

        // by default tapplets are supposed to work with the Ootle
        // run the Ootle dev/registed tapplet below
        return;
    },
    setDevTapplet: async (tappPath: string) => {
        console.info('🐦‍🔥 dev tapp path', tappPath);
        if (!tappPath) return;
        const tappProviderState = useTappletSignerStore.getState();
        if (!tappProviderState.isInitialized) tappProviderState.initTappletSigner();

        // dev tapplet
        const activeTapplet = await invoke('launch_dev_tapplet', { path: tappPath });
        set({ activeTapplet });
        return;
    },
    setOngoingBridgeTx: (tx: BridgeTxDetails) => {
        set({
            ongoingBridgeTx: tx,
            isPendingTappletTx: true,
        });
    },
    removeOngoingBridgeTx: () => {
        set({
            ongoingBridgeTx: undefined,
            isPendingTappletTx: false,
        });
    },
}));
