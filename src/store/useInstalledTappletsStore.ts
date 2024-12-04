import { invoke } from '@tauri-apps/api';
import { create } from './create.ts';
import { InstalledTappletWithName } from '@app/types/tapplet.ts';
import { useAppStateStore } from './appStateStore.ts';

interface State {
    isInitialized: boolean;
    isFetching: boolean;
    installedTapplets: InstalledTappletWithName[];
}

interface Actions {
    fetchInstalledTapplets: () => Promise<void>;
}

type InstalledTappletsStoreState = State & Actions;

const initialState: State = {
    isFetching: false,
    isInitialized: false,
    installedTapplets: [],
};

export const useInstalledTappletsStore = create<InstalledTappletsStoreState>()((set) => ({
    ...initialState,
    fetchInstalledTapplets: async () => {
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
            const tappletsWithAssets: InstalledTappletWithName[] = [
                {
                    display_name: 'installed tapp disp name',
                    installed_tapplet: {
                        id: '',
                        tapplet_id: '',
                        tapplet_version_id: '',
                    },
                    installed_version: '',
                    latest_version: '',
                },
            ];
            set({ isFetching: false, isInitialized: true, installedTapplets: tappletsWithAssets });
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            console.error('Error fetching installed tapplets: ', error);
            appStateStore.setError(`'Error fetching installed tapplets: ${error}`);
        }
    },
    addInstalledTapplet: async () => {
        console.log('store fetch tapp');
        set({ isFetching: true });
        try {
            // TODO invoke to add tapplet
            // await invoke('download_and_extract_tapp');
            // await invoke('insert_installed_tapp_db');

            // TODO tmp solution
            const tappletsWithAssets: InstalledTappletWithName[] = [
                {
                    display_name: 'installed tapp disp name',
                    installed_tapplet: {
                        id: '',
                        tapplet_id: '',
                        tapplet_version_id: '',
                    },
                    installed_version: '',
                    latest_version: '',
                },
            ];
            set({ isFetching: false, isInitialized: true, installedTapplets: tappletsWithAssets });
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            console.error('Error installing tapplet: ', error);
            appStateStore.setError(`'Error installing tapplet: ${error}`);
        }
    },
}));
