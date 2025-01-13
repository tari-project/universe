import { invoke } from '@tauri-apps/api/core';
import { create } from './create.ts';
import {
    ActiveTapplet,
    DevTapplet,
    InstalledTappletWithAssets,
    RegisteredTapplet,
    RegisteredTappletWithAssets,
} from '@app/types/ootle/tapplet.ts';
import { useAppStateStore } from './appStateStore.ts';

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
    addDevTapp: (endpoint: string) => Promise<void>;
    deleteDevTapp: (devTappletId: number) => Promise<void>;
    deleteInstalledTapp: (tappletId: number) => Promise<void>;
    updateInstalledTapp: (tappletId: number, installedTappletId: number) => Promise<void>;
    getDevTapps: () => Promise<void>;
    getTappById: (id?: number) => ActiveTapplet | undefined;
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
            // set({ isInitialized: true, installedTapplets: [... state.items] });
            const tst: InstalledTappletWithAssets = {
                display_name: tapplet.display_name,
                installed_tapplet: installedTapplet,
                installed_version: installedTapplet.tapplet_version_id,
                latest_version: '',
                logoAddr: tapplet.logoAddr,
                backgroundAddr: tapplet.backgroundAddr,
            };

            set((state) => ({
                isInitialized: true,
                installedTapplets: [...state.installedTapplets, tst],
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
    getTappById: (id?: number) => {
        console.info('[STORE] get active tapp - id', id);
        // const tapp = get().installedTapplets.find((tapp) => tapp.installed_tapplet.id === id); TODO
        const devTapp = get().devTapplets.find((tapp) => tapp.id === id);
        if (!devTapp) return undefined;
        return {
            tapplet_id: devTapp.id,
            display_name: devTapp?.display_name,
            source: devTapp?.endpoint,
            version: '0.0.1',
            permissions: undefined, //TODO
            supportedChain: [],
        };
    },
    addDevTapp: async (endpoint) => {
        const devTapp = await invoke('add_dev_tapplet', { endpoint });
        const devTapplets = await invoke('read_dev_tapplets');
        console.info('[STORE] add dev tapp', devTapp);
        console.info('[STORE] add dev tapplets', devTapplets);
        // set((state) => ({
        //     devTapplets: [...state.devTapplets, devTapp],
        // }));
        set({ devTapplets });
    },
    deleteDevTapp: async (devTappletId) => {
        const removedTappSize = await invoke('delete_dev_tapplet', { devTappletId });
        console.info('[STORE] delete dev tapp: id | db removedTappSize', devTappletId, removedTappSize);
        set((state) => ({ devTapplets: state.devTapplets.filter((tapp) => tapp.id !== devTappletId) }));
    },
    getDevTapps: async () => {
        const devTapplets = await invoke('read_dev_tapplets');
        console.info('[STORE] add dev tapplets', devTapplets);
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
