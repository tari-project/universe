import { invoke } from '@tauri-apps/api';
import { create } from './create.ts';
import { RegisteredTappletWithAssets } from '@app/types/tapplet.ts';
import { useAppStateStore } from './appStateStore.ts';

interface State {
    isInitialized: boolean;
    isFetching: boolean;
    registeredTapplets: RegisteredTappletWithAssets[];
}

interface Actions {
    fetchRegisteredTapplets: () => Promise<void>;
}

type RegisteredTappletsStoreState = State & Actions;

const initialState: State = {
    isFetching: false,
    isInitialized: false,
    registeredTapplets: [],
};

export const useRegisteredTappletsStore = create<RegisteredTappletsStoreState>()((set) => ({
    ...initialState,
    fetchRegisteredTapplets: async () => {
        console.log('store fetch tapp');
        set({ isFetching: true });
        try {
            // TODO invoke to fetch tapplets
            // await invoke('fetch_tapplets');
            // const registeredTapplets: RegisteredTapplet[] = await invoke('read_tapp_registry_db');
            // const assetsServerAddr = await invoke('get_assets_server_addr');
            // const tappletsWithAssets = registeredTapplets.map((tapp) => ({
            //     ...tapp,
            //     logoAddr: `${assetsServerAddr}/${tapp.package_name}/logo.svg`,
            //     backgroundAddr: `${assetsServerAddr}/${tapp.package_name}/background.svg`,
            // }));
            // TODO tmp solution
            const tappletsWithAssets: RegisteredTappletWithAssets[] = [
                {
                    id: 'test0',
                    registry_id: '0',
                    package_name: '',
                    display_name: 'Registered tapp display name',
                    author_name: '',
                    author_website: '',
                    about_summary: '',
                    about_description: '',
                    category: '',
                    logoAddr: '',
                    backgroundAddr: '',
                },
                {
                    id: 'test1',
                    registry_id: '1',
                    package_name: '',
                    display_name: 'Registered tapp awesome name',
                    author_name: '',
                    author_website: '',
                    about_summary: '',
                    about_description: '',
                    category: '',
                    logoAddr: '',
                    backgroundAddr: '',
                },
            ];
            set({ isFetching: false, isInitialized: true, registeredTapplets: tappletsWithAssets });
        } catch (error) {
            const appStateStore = useAppStateStore.getState();
            console.error('Error fetching registered tapplets: ', error);
            appStateStore.setError(`'Error fetching registered tapplets: ${error}`);
        }
    },
}));
