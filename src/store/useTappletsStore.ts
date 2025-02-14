import { invoke } from '@tauri-apps/api/core';
import { create } from './create.ts';
import {
    ActiveTapplet,
    DevTapplet,
    InstalledTappletWithAssets,
    RegisteredTapplet,
    RegisteredTappletWithAssets,
    TappletConfig,
} from '@app/types/ootle/tapplet.ts';
import { useAppStateStore } from './appStateStore.ts';
import { TAPPLET_CONFIG_FILE } from '@app/components/ootle/ActiveTappletView.tsx';
import { useTappletProviderStore } from './useTappletProviderStore.ts';

interface State {
    isInitialized: boolean;
    isFetching: boolean;
    devTapplets: DevTapplet[];
    installedTapplets: InstalledTappletWithAssets[];
    registeredTapplets: RegisteredTappletWithAssets[];
    activeTapplet: ActiveTapplet | undefined;
}

interface Actions {
    installRegisteredTapp: (tappletId: string) => Promise<void>;
    fetchRegisteredTapps: () => Promise<void>;
    getInstalledTapps: () => Promise<void>;
    setActiveTapp: (tapplet?: ActiveTapplet) => Promise<void>;
    setActiveTappById: (tappletId: number, isDev?: boolean) => Promise<void>;
    deactivateTapplet: () => Promise<void>;
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
    installedTapplets: [],
    registeredTapplets: [],
    devTapplets: [],
    activeTapplet: undefined,
};

export const useTappletsStore = create<TappletsStoreState>()((set, get) => ({
    ...initialState,
    fetchRegisteredTapps: async () => {
        console.info('[STORE TAPP] fetch registered tapp');
        set({ isFetching: true });
        try {
            // TODO invoke to fetch tapplets
            await invoke('fetch_registered_tapplets');
            console.info('[STORE TAPP] fetch tapp done');
            const registeredTapplets: RegisteredTapplet[] = await invoke('read_tapp_registry_db');
            console.info('[STORE TAPP] read db tapp done', registeredTapplets);
            const assetsServerAddr = await invoke('get_assets_server_addr');
            const tappletsWithAssets = registeredTapplets.map((tapp) => ({
                ...tapp,
                logoAddr: `${assetsServerAddr}/${tapp.package_name}/logo.svg`,
                backgroundAddr: `${assetsServerAddr}/${tapp.package_name}/background.svg`,
            }));

            set({ isFetching: false, isInitialized: true, registeredTapplets: tappletsWithAssets });
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            console.error('Error fetching registered tapplets: ', error);
            appStateStore.setError(`'Error fetching registered tapplets: ${error}`);
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
            const appStateStore = useAppStateStore.getState();
            console.error('Error fetching registered tapplets: ', error);
            appStateStore.setError(`'Error fetching registered tapplets: ${error}`);
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
                display_name: tapplet.display_name,
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
            const appStateStore = useAppStateStore.getState();
            console.error('Error installing tapplet: ', error);
            appStateStore.setError(`'Error installing tapplet: ${error}`);
        }
    },
    setActiveTapp: async (tapplet) => {
        set({ activeTapplet: tapplet });
    },
    deactivateTapplet: async () => {
        set({ activeTapplet: undefined });
    },
    setActiveTappById: async (tappletId, isDev) => {
        console.info('SET ACTIVE TAP', tappletId, get().activeTapplet?.tapplet_id);
        if (tappletId == get().activeTapplet?.tapplet_id) return;
        const tappProviderState = useTappletProviderStore.getState();
        // dev tapplet
        if (isDev) {
            const tapplet = get().devTapplets.find((tapp) => tapp.id === tappletId);
            if (!tapplet) return;
            const resp = await fetch(`${tapplet.endpoint}/${TAPPLET_CONFIG_FILE}`);
            if (!resp.ok) return;
            const config: TappletConfig = await resp.json();
            console.info('Dev Tapplet config', config);
            if (!config) return;
            const activeTapplet: ActiveTapplet = {
                tapplet_id: tapplet.id,
                version: config.version,
                display_name: tapplet.display_name,
                source: tapplet.endpoint,
                permissions: config.permissions,
                supportedChain: config.supportedChain,
            };
            set({ activeTapplet });
            tappProviderState.setTappletProvider(config.packageName, activeTapplet);
            return;
        }

        const activeTapplet = await invoke('launch_tapplet', { installedTappletId: tappletId });
        set({ activeTapplet });
        tappProviderState.setTappletProvider(tappletId.toString(), activeTapplet);
        return;
    },
    addDevTapp: async (endpoint) => {
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
