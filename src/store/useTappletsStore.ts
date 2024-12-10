import { invoke } from '@tauri-apps/api';
import { create } from './create.ts';
import {
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
    activeTappletId?: number;
}

interface Actions {
    installRegisteredTapp: (tappletId: string) => Promise<void>;
    fetchRegisteredTapps: () => Promise<void>;
    setActiveTapp: (id: number) => Promise<void>;
    addDevTapp: (endpoint: string) => Promise<void>;
    deleteDevTapp: (devTappletId: number) => Promise<void>;
    getActiveTapp: () => InstalledTappletWithAssets | undefined;
    fetchDevTappDb: () => Promise<void>;
}

type TappletsStoreState = State & Actions;

const initialState: State = {
    isFetching: false,
    isInitialized: false,
    installedTapplets: [],
    registeredTapplets: [],
    devTapplets: [],
    activeTappletId: undefined,
};

export const useTappletsStore = create<TappletsStoreState>()((set, get) => ({
    ...initialState,
    fetchRegisteredTapps: async () => {
        console.log('[STORE TAPP] fetch registered tapp');
        set({ isFetching: true });
        try {
            // TODO invoke to fetch tapplets
            await invoke('fetch_tapplets');
            console.log('[STORE TAPP] fetch tapp done');
            const registeredTapplets: RegisteredTapplet[] = await invoke('read_tapp_registry_db');
            console.log('[STORE TAPP] read db tapp done', registeredTapplets);
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

    installRegisteredTapp: async (tappletId: string) => {
        console.log('[STORE] fetch tapp');
        try {
            // TODO invoke to add tapplet
            const tapplet = await invoke('download_and_extract_tapp', { tappletId });
            const installedTapplet = await invoke('insert_installed_tapp_db', { tappletId });
            console.log('[STORE] fetch tapp success', tapplet, installedTapplet);
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
    setActiveTapp: async (installedTappletId) => {
        console.log('[STORE] set active tapp id', installedTappletId);
        set({ activeTappletId: installedTappletId });
    },
    getActiveTapp: () => {
        const id = get().activeTappletId?.toString();
        console.log('[STORE] get active tapp - id', id);
        return get().installedTapplets.find((tapp) => tapp.installed_tapplet.id === id);
    },
    addDevTapp: async (endpoint) => {
        const devTapp = await invoke('add_dev_tapplet', { endpoint });
        const devTapplets = await invoke('read_dev_tapplets');
        console.log('[STORE] add dev tapp', devTapp);
        console.log('[STORE] add dev tapplets', devTapplets);
        // set((state) => ({
        //     devTapplets: [...state.devTapplets, devTapp],
        // }));
        set({ devTapplets });
    },
    deleteDevTapp: async (devTappletId) => {
        const removedTappSize = await invoke('delete_dev_tapplet', { devTappletId });
        console.log('[STORE] delete dev tapp: id | db removedTappSize', devTappletId, removedTappSize);
        set((state) => ({ devTapplets: state.devTapplets.filter((tapp) => tapp.id !== devTappletId) }));
    },
    fetchDevTappDb: async () => {
        const devTapplets = await invoke('read_dev_tapplets');
        console.log('[STORE] add dev tapplets', devTapplets);
        // set((state) => ({
        //     devTapplets: [...state.devTapplets, devTapp],
        // }));
        set({ devTapplets });
    },
}));
