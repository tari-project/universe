import { invoke } from '@tauri-apps/api';
import { create } from './create.ts';
import { DevTapplet } from '@app/types/tapplet.ts';
import { useAppStateStore } from './appStateStore.ts';

interface State {
    isInitialized: boolean;
    isFetching: boolean;
    devTapplets: DevTapplet[];
}

interface Actions {
    fetchDevTapplets: () => Promise<void>;
}

type DevTappletsStoreState = State & Actions;

const initialState: State = {
    isFetching: false,
    isInitialized: false,
    devTapplets: [],
};

export const useDevTappletsStore = create<DevTappletsStoreState>()((set) => ({
    ...initialState,
    fetchDevTapplets: async () => {
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
    addInstalledTapplet: async () => {
        console.log('store fetch tapp');
        try {
            const state = useDevTappletsStore.getState();
            // TODO invoke to add tapplet
            // const tapp = await invoke("add_dev_tapplet", { endpoint })
            const tapp: DevTapplet = {
                id: '',
                display_name: 'Dev Tapplet name',
                endpoint: '',
                about_description: '',
                about_summary: '',
                package_name: '',
            };

            set({ isInitialized: true });
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            console.error('Error installing tapplet: ', error);
            appStateStore.setError(`'Error installing tapplet: ${error}`);
        }
    },
}));
