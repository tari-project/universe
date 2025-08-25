import { create } from './create.ts';
import {
    ActiveTapplet,
    BridgeTxDetails,
    DevTapplet,
    InstalledTappletWithAssets,
    RegisteredTapplet,
} from '@app/types/tapplets/tapplet.types.ts';
import { useTappletSignerStore } from './useTappletSignerStore.ts';
import { invoke } from '@tauri-apps/api/core';
import { setError } from './index.ts';
import { fetchActiveTapplet, isHttpOrLocalhost } from '@app/utils/ootle.ts';

interface State {
    isInitialized: boolean;
    isFetching: boolean;
    activeTapplet: ActiveTapplet | null;
    ongoingBridgeTx: BridgeTxDetails | undefined;
    isPendingTappletTx: boolean;
    devTapplets: DevTapplet[];
    installedTapplets: InstalledTappletWithAssets[];
    registeredTapplets: RegisteredTapplet[];
    runningTapplets: ActiveTapplet[];
    allowedIframeMsgOrigins: Record<number, string[]>;
}

interface Actions {
    setActiveTapp: (tapplet: ActiveTapplet) => Promise<void>;
    setActiveTappById: (tappletId: number, isBuiltIn?: boolean, isDev?: boolean) => Promise<void>;
    deactivateTapplet: () => Promise<void>;
    setOngoingBridgeTx: (tx: BridgeTxDetails) => void;
    removeOngoingBridgeTx: () => void;
    installRegisteredTapp: (tappletId: number) => Promise<void>;
    fetchRegisteredTapps: () => Promise<void>;
    getInstalledTapps: () => Promise<void>;
    addDevTapp: (source: string) => Promise<void>;
    deleteDevTapp: (devTappletId: number) => Promise<void>;
    deleteInstalledTapp: (tappletId: number) => Promise<void>;
    updateInstalledTapp: (tappletId: number, installedTappletId: number) => Promise<void>;
    getDevTapps: () => Promise<void>;
    stopTapp: (tappletId: number) => Promise<void>;
    restartTapp: (tappletId: number) => Promise<void>;
    setAllowedIframeMsgOrigins: (tappletId: number, origin: string) => void;
}

type TappletsStoreState = State & Actions;

const initialState: State = {
    isFetching: false,
    isInitialized: false,
    activeTapplet: null,
    ongoingBridgeTx: undefined,
    isPendingTappletTx: false,
    installedTapplets: [],
    registeredTapplets: [],
    devTapplets: [],
    runningTapplets: [],
    allowedIframeMsgOrigins: { 1: ['wxtm-bridge-frontend'] }, //TODO remove init - this is just test
};

export const useTappletsStore = create<TappletsStoreState>()((set, get) => ({
    ...initialState,
    setActiveTapp: async (tapplet) => {
        set({ activeTapplet: tapplet });
    },
    deactivateTapplet: async () => {
        set({ activeTapplet: null });
    },
    setActiveTappById: async (tappletId, isBuiltIn = false, isDev = false) => {
        console.info('Set Active Tapplet: ', tappletId, isBuiltIn);
        if (tappletId == get().activeTapplet?.tapplet_id) return;
        const tappProviderState = useTappletSignerStore.getState();
        if (!tappProviderState.isInitialized) tappProviderState.initTappletSigner();

        // built-in tapplet
        if (isBuiltIn) {
            const name = 'bridge'; //TODO add names for more options
            try {
                console.info('🚗 RUN BUILDIN');
                const activeTapplet = await invoke('start_tari_tapplet_binary', { binaryName: name });
                set((state) => ({
                    activeTapplet,
                    runningTapplets: state.runningTapplets.some((item) => item.tapplet_id === activeTapplet.tapplet_id)
                        ? state.runningTapplets
                        : [...state.runningTapplets, activeTapplet],
                }));
            } catch (error) {
                console.error(`Tapplet (id: ${tappletId} name: ${name}) startup error: ${error}`);
                setError(`Tapplet (id: ${tappletId} name: ${name}) startup error: ${error}`);
            }
            return;
        }

        if (isDev) {
            const tapplet = get().devTapplets.find((tapp) => tapp.id === tappletId);
            if (!tapplet) {
                setError(`Tapplet with id: ${tappletId} not found`);
                return;
            }

            //TODO add case if dev tapplet's already running and if not - run local server (start_tari_tapplet_binary)
            console.info('is http?', isHttpOrLocalhost(tapplet.source));
            if (isHttpOrLocalhost(tapplet.source)) {
                try {
                    console.info('🚗 RUN HTTP ', tapplet?.display_name);
                    const activeTapplet = await fetchActiveTapplet(tapplet);
                    if (!activeTapplet) return;
                    set((state) => ({
                        activeTapplet,
                        runningTapplets: state.runningTapplets.some(
                            (item) => item.tapplet_id === activeTapplet.tapplet_id
                        )
                            ? state.runningTapplets
                            : [...state.runningTapplets, activeTapplet],
                    }));

                    tappProviderState.setTappletSigner(activeTapplet?.package_name); //TODO
                } catch (error) {
                    console.error(`Running dev tapplet localhost error: ${error}`);
                    setError(`Running dev tapplet localhost error: ${error}`);
                }
                return;
            }

            // by default tapplets are supposed to work with the Ootle
            // run the Ootle dev/registed tapplet below
            console.info('🚗 RUN DEV', tappletId);

            try {
                const activeTapplet = await invoke('start_dev_tapplet', {
                    devTappletId: tappletId,
                });
                // TODO not push if already in array
                set((state) => ({
                    activeTapplet,
                    runningTapplets: state.runningTapplets.some((item) => item.tapplet_id === activeTapplet.tapplet_id)
                        ? state.runningTapplets
                        : [...state.runningTapplets, activeTapplet],
                }));
            } catch (error) {
                console.error(`Dev Tapplet startup error: ${error}`);
                setError(`Dev Tapplet startup error: ${error}`);
            }
            return;
        }
        try {
            const activeTapplet = await invoke('start_tapplet', {
                tappletId: tappletId,
            });
            set((state) => ({
                activeTapplet,
                runningTapplets: [...state.runningTapplets, activeTapplet],
            }));
        } catch (error) {
            console.error(`Tapplet startup error: ${error}`);
            setError(`Tapplet startup error: ${error}`);
        }

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

    // add
    fetchRegisteredTapps: async () => {
        console.info('[STORE TAPP] fetch registered tapp');
        set({ isFetching: true });
        try {
            await invoke('fetch_registered_tapplets');
            console.info('[STORE TAPP] fetch tapp done');
            const registeredTapplets = await invoke('read_tapp_registry_db');
            console.info('[STORE TAPP] read db tapp done', registeredTapplets);

            // TODO fix fetching assets
            // const assetsServerAddr = await invoke('get_assets_server_addr');
            // const tappletsWithAssets = registeredTapplets.map((tapp) => ({
            //     ...tapp,
            //     logoAddr: `${assetsServerAddr}/${tapp.package_name}/logo.svg`,
            //     backgroundAddr: `${assetsServerAddr}/${tapp.package_name}/background.svg`,
            // }));

            set({ isFetching: false, isInitialized: true, registeredTapplets: registeredTapplets });
        } catch (error) {
            console.error(`Fetching registered tapplets error: ${error}`);
            setError(`Fetching registered tapplets error: ${error}`);
        }
    },
    getInstalledTapps: async () => {
        console.info('[STORE TAPP] fetch registered tapp');
        set({ isFetching: true });
        try {
            const installedTapplets = await invoke('read_installed_tapp_db');
            console.info('[STORE] get installed tapp success', installedTapplets);
            set({ installedTapplets });
        } catch (error) {
            console.error(`Getting installed tapplets error: ${error}`);
            setError(`Getting installed tapplets error: ${error}`);
        }
    },
    installRegisteredTapp: async (tappletId: number) => {
        try {
            const tapplet = await invoke('download_and_extract_tapp', { tappletId });

            const tapp: InstalledTappletWithAssets = {
                installed_tapplet: tapplet.installed_tapplet,
                display_name: tapplet.display_name,
                installed_version: tapplet.installed_version,
                latest_version: tapplet.latest_version,
                icon_url: tapplet.icon_url,
                background_url: tapplet.background_url,
            };
            console.info('[STORE] installed tapplet', tapp);

            set((state) => ({
                isInitialized: true,
                installedTapplets: [...state.installedTapplets, tapp],
            }));
        } catch (error) {
            console.error(`Installing registered tapplet error: ${error}`);
            setError(`Installing registered tapplet error: ${error}`);
        }
    },
    addDevTapp: async (source) => {
        try {
            console.info('[STORE] add dev tapp source', source);
            const devTapp = await invoke('add_dev_tapplet', { source });
            console.info('[STORE] add dev tapp', devTapp);
            const devTapplets = await invoke('read_dev_tapplets_db');
            console.info('[STORE] add dev tapplets', devTapplets);
            set({ devTapplets });
        } catch (error) {
            console.error(`Adding dev tapplet error: ${error}`);
            setError(`Adding dev tapplet error: ${error}`);
        }
    },
    deleteDevTapp: async (devTappletId) => {
        try {
            const removedTappSize = await invoke('delete_dev_tapplet', { devTappletId });
            console.info('[STORE] delete dev tapp: id | db removedTappSize', devTappletId, removedTappSize);
            set((state) => ({ devTapplets: state.devTapplets.filter((tapp) => tapp.id !== devTappletId) }));
            if (devTappletId == get().activeTapplet?.tapplet_id) {
                set({ activeTapplet: null });
            }
            set((state) => ({
                runningTapplets: state.runningTapplets.filter((tapp) => tapp.tapplet_id !== devTappletId),
            }));
        } catch (error) {
            console.error(`Deleting tapplet error: ${error}`);
            setError(`Deleting tapplet error: ${error}`);
        }
    },
    getDevTapps: async () => {
        try {
            const devTapplets = await invoke('read_dev_tapplets_db');
            console.info('[STORE get dev tapplets', devTapplets);
            set({ devTapplets });
        } catch (error) {
            console.error(`Reading dev tapplets db error: ${error}`);
            setError(`Reading dev tapplets db error: ${error}`);
        }
    },
    deleteInstalledTapp: async (tappletId) => {
        try {
            const removedTappSize = await invoke('delete_installed_tapplet', { tappletId });
            console.info('[STORE] delete installed tapp: id | db removedTappSize', tappletId, removedTappSize);
            set((state) => ({
                installedTapplets: state.installedTapplets.filter((tapp) => tapp.installed_tapplet.id !== tappletId),
            }));
            if (tappletId == get().activeTapplet?.tapplet_id) {
                set({ activeTapplet: null });
            }
            set((state) => ({
                runningTapplets: state.runningTapplets.filter((tapp) => tapp.tapplet_id !== tappletId),
            }));
        } catch (error) {
            console.error(`Deleting dev tapplet error: ${error}`);
            setError(`Deleting dev tapplet error: ${error}`);
        }
    },
    updateInstalledTapp: async (tappletId, installedTappletId) => {
        try {
            const installedTapplets = await invoke('update_installed_tapplet', { tappletId, installedTappletId });
            console.info('[STORE] update tapp: id | installedTappId', tappletId, installedTappletId);
            set({ installedTapplets });
        } catch (error) {
            console.error(`Updating tapplet error: ${error}`);
            setError(`Updating tapplet error: ${error}`);
        }
    },
    stopTapp: async (tappletId: number) => {
        try {
            const serverAddress = await invoke('stop_tapplet', { tappletId });
            console.info('[STORE] tapplet stopped', tappletId, serverAddress);
            set((state) => ({
                runningTapplets: state.runningTapplets.filter((tapp) => tapp.tapplet_id !== tappletId),
            }));
        } catch (error) {
            console.error(`Stopping tapplet error: ${error}`);
            setError(`Stopping tapplet error: ${error}`);
        }
    },
    restartTapp: async (tappletId: number) => {
        try {
            const serverAddress = await invoke('restart_tapplet', { tappletId });
            console.info('[STORE] tapplet restarted', tappletId, serverAddress);
        } catch (error) {
            console.error(`Restarting tapplet error: ${error}`);
            setError(`Restarting tapplet error: ${error}`);
        }
    },
    setAllowedIframeMsgOrigins: (tappletId: number, origin: string) => {
        set((state) => {
            const currentOrigins = state.allowedIframeMsgOrigins[tappletId] || [];
            return {
                allowedIframeMsgOrigins: {
                    ...state.allowedIframeMsgOrigins,
                    [tappletId]: [...currentOrigins, origin],
                },
            };
        });
    },
}));
