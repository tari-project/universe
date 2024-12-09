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
    getInstalledTapps: () => Promise<void>;
    getDevTapps: () => Promise<void>;
    setActiveTapp: (id?: string) => Promise<void>;
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
    getInstalledTapps: async () => {
        console.log('store fetch tapp');
        set({ isFetching: true });
        try {
            // TODO invoke to fetch tapplets
            // const installedTapplets: RegisteredTapplet[] = await invoke('read_installed_tapp_db');
            // const assetsServerAddr = await invoke('get_assets_server_addr');
            // const tappletsWithAssets = installedTapplets.map((tapp) => ({
            //     ...tapp,
            //     logoAddr: `${assetsServerAddr}/${tapp.package_name}/logo.svg`,
            //     backgroundAddr: `${assetsServerAddr}/${tapp.package_name}/background.svg`,
            // }));
            // TODO tmp solution
            const installedTapps: InstalledTappletWithAssets[] = [
                {
                    display_name: 'installed tapp disp name',
                    installed_tapplet: {
                        id: '1',
                        tapplet_id: '1',
                        tapplet_version_id: '',
                    },
                    installed_version: '0.0.1',
                    latest_version: '0.0.2',
                    logoAddr: '',
                    backgroundAddr: '',
                },
            ];
            set({ isFetching: false, isInitialized: true, installedTapplets: installedTapps });
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            console.error('Error fetching installed tapplets: ', error);
            appStateStore.setError(`'Error fetching installed tapplets: ${error}`);
        }
    },
    getDevTapps: async () => {
        console.log('store fetch tapp');
        set({ isFetching: true });
        try {
            // TODO invoke to fetch tapplets
            // await invoke('fetch_tapplets');
            // const devTapplets: DevTapplet[] = await invoke('read_dev_tapplets');
            // const assetsServerAddr = await invoke('get_assets_server_addr');

            // TODO tmp solution
            const tappletsWithAssets: DevTapplet[] = [
                {
                    id: '',
                    display_name: 'Dev Tapplet name',
                    endpoint: '',
                    about_description: '',
                    about_summary: '',
                    package_name: '',
                },
            ];
            set({ isFetching: false, isInitialized: true, devTapplets: tappletsWithAssets });
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            console.error('Error fetching dev tapplets: ', error);
            appStateStore.setError(`'Error fetching dev tapplets: ${error}`);
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
}));
