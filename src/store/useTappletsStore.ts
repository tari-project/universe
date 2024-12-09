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
    activeTapplet?: DevTapplet | InstalledTappletWithAssets;
}

interface Actions {
    installRegisteredTapp: (tappletId: string) => Promise<void>;
    fetchRegisteredTapps: () => Promise<void>;
    setActiveTapp: (id?: string) => Promise<void>;
    addDevTapp: (endpoint: string) => Promise<void>;
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

export const useTappletsStore = create<TappletsStoreState>()((set) => ({
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
    setActiveTapp: async (id) => {
        console.log('[STORE] set active tapp id', id);
        const tapp = id
            ? {
                  id,
                  display_name: 'Active Dev Tapplet name',
                  endpoint: '',
                  about_description: '',
                  about_summary: '',
                  package_name: '',
              }
            : undefined;

        set({ isFetching: false, isInitialized: true, activeTapplet: tapp });
    },
    addDevTapp: async (endpoint) => {
        const devTapp = await invoke('add_dev_tapplet', { endpoint });
        console.log('[STORE] dev tapp', devTapp);
        set((state) => ({
            devTapplets: [...state.devTapplets, devTapp],
        }));
    },
}));
