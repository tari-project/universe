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
}

interface Actions {
    setActiveTapp: (tapplet: ActiveTapplet) => Promise<void>;
    setActiveTappById: (tappletId: number, isBuiltIn?: boolean, isDev?: boolean) => Promise<void>;
    setDevTapplet: (tappPath: string) => Promise<void>;
    deactivateTapplet: () => Promise<void>;
    setOngoingBridgeTx: (tx: BridgeTxDetails) => void;
    removeOngoingBridgeTx: () => void;
    installRegisteredTapp: (tappletId: string) => Promise<void>;
    fetchRegisteredTapps: () => Promise<void>;
    getInstalledTapps: () => Promise<void>;
    addDevTapp: (endpoint: string) => Promise<void>;
    deleteDevTapp: (devTappletId: number) => Promise<void>;
    deleteInstalledTapp: (tappletId: number) => Promise<void>;
    updateInstalledTapp: (tappletId: number, installedTappletId: number) => Promise<void>;
    getDevTapps: () => Promise<void>;
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
};

export const useTappletsStore = create<TappletsStoreState>()((set, get) => ({
    ...initialState,
    setActiveTapp: async (tapplet) => {
        set({ activeTapplet: tapplet });
    },
    deactivateTapplet: async () => {
        set({ activeTapplet: null });
    },
    setActiveTappById: async (tappletId, isBuiltIn = false) => {
        console.info('Set Active Tapplet: ', tappletId, isBuiltIn);
        if (tappletId == get().activeTapplet?.tapplet_id) return;
        const tappProviderState = useTappletSignerStore.getState();
        if (!tappProviderState.isInitialized) tappProviderState.initTappletSigner();
        const tapplet = get().devTapplets.find((tapp) => tapp.id === tappletId);
        if (!tapplet) {
            setError(`Tapplet with id: ${tappletId} not found`);
            return;
        }

        //TODO add case if dev tapplet's already running and if not - run local server (launch_builtin_tapplet)
        console.info('is http?', isHttpOrLocalhost(tapplet.endpoint));
        if (isHttpOrLocalhost(tapplet.endpoint)) {
            try {
                console.info('🚗 RUN HTTP ', tapplet?.display_name);
                const activeTapplet = await fetchActiveTapplet(tapplet);
                if (!activeTapplet) return;
                set({ activeTapplet });
                tappProviderState.setTappletSigner(activeTapplet?.package_name); //TODO
            } catch (error) {
                console.error('Error running Dev Tapplet: ', error);
                setError(`'Error running Dev Tapplet: ${error}`);
            }
            return;
        }

        // built-in tapplet
        if (isBuiltIn) {
            console.info('🚗 RUN BUILDIN');
            const activeTapplet = await invoke('launch_builtin_tapplet');
            set({ activeTapplet });
            return;
        }

        // by default tapplets are supposed to work with the Ootle
        // run the Ootle dev/registed tapplet below
        console.info('🚗 RUN DEV', tappletId);
        const activeTapplet = await invoke('launch_dev_tapplet', { tapplet_id: tappletId, path: tapplet.endpoint });
        set({ activeTapplet });
        return;
    },
    setDevTapplet: async (tappPath: string) => {
        console.info('🐦‍🔥 SET DEV TAPPLET CURRENTLY UNAVAILABLE', tappPath);
        if (!tappPath) return;
        const tappProviderState = useTappletSignerStore.getState();
        if (!tappProviderState.isInitialized) tappProviderState.initTappletSigner();

        // dev tapplet
        // const activeTapplet = await invoke('launch_dev_tapplet', { path: tappPath });
        // set({ activeTapplet });
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
            console.error('Error fetching registered tapplets: ', error);
            setError(`'Error fetching registered tapplets: ${error}`);
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
            console.error('Error fetching registered tapplets: ', error);
            setError(`'Error fetching registered tapplets: ${error}`);
        }
    },
    installRegisteredTapp: async (tappletId: string) => {
        console.info('[STORE] fetch tapp');
        try {
            // TODO invoke to add tapplet
            const tapplet = await invoke('download_and_extract_tapp', { tappletId });
            const installedTapplet = await invoke('insert_installed_tapp_db', { tappletId });
            console.info('[STORE] fetch tapp success', tapplet, installedTapplet);
            // TODO refactor types and assets path
            const tapp: InstalledTappletWithAssets = {
                display_name: tapplet.displayName,
                installed_tapplet: installedTapplet,
                installed_version: installedTapplet.tapplet_version_id,
                latest_version: '',
                logoAddr: tapplet.logoAddr,
                backgroundAddr: tapplet.backgroundAddr,
            };

            set((state) => ({
                isInitialized: true,
                installedTapplets: [...state.installedTapplets, tapp],
            }));
        } catch (error) {
            console.error('Error installing tapplet: ', error);
            setError(`'Error installing tapplet: ${error}`);
        }
    },
    addDevTapp: async (endpoint) => {
        console.info('[STORE] add dev tapp endpoint', endpoint);
        const devTapp = await invoke('add_dev_tapplet', { endpoint });
        console.info('[STORE] add dev tapp', devTapp);
        const devTapplets = await invoke('read_dev_tapplets');
        console.info('[STORE] add dev tapplets', devTapplets);
        set({ devTapplets });
    },
    deleteDevTapp: async (devTappletId) => {
        const removedTappSize = await invoke('delete_dev_tapplet', { devTappletId });
        console.info('[STORE] delete dev tapp: id | db removedTappSize', devTappletId, removedTappSize);
        set((state) => ({ devTapplets: state.devTapplets.filter((tapp) => tapp.id !== devTappletId) }));
    },
    getDevTapps: async () => {
        const devTapplets = await invoke('read_dev_tapplets');
        console.info('[STORE get dev tapplets', devTapplets);
        set({ devTapplets });
    },
    deleteInstalledTapp: async (tappletId) => {
        const removedTappSize = await invoke('delete_installed_tapplet', { tappletId });
        console.info('[STORE] delete installed tapp: id | db removedTappSize', tappletId, removedTappSize);
        set((state) => ({
            installedTapplets: state.installedTapplets.filter((tapp) => tapp.installed_tapplet.id !== tappletId),
        }));
    },
    updateInstalledTapp: async (tappletId, installedTappletId) => {
        const installedTapplets = await invoke('update_installed_tapplet', { tappletId, installedTappletId });
        console.info('[STORE] update tapp: id | installedTappId', tappletId, installedTappletId);
        set({ installedTapplets });
    },
}));
