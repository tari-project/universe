import { invoke } from '@tauri-apps/api';
import { create } from './create';
import { AppConfig } from '../types/app-status.ts';
import { useAppStateStore } from './appStateStore.ts';
import { modeType } from './types.ts';
import { Language } from '@app/i18initializer.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';

type State = Partial<AppConfig>;

interface Actions {
    fetchAppConfig: () => Promise<void>;
    setAllowTelemetry: (allowTelemetry: boolean) => Promise<void>;
    setCpuMiningEnabled: (enabled: boolean) => Promise<void>;
    setGpuMiningEnabled: (enabled: boolean) => Promise<void>;
    setP2poolEnabled: (p2poolEnabled: boolean) => Promise<void>;
    setMoneroAddress: (moneroAddress: string) => Promise<void>;
    setMode: (mode: modeType) => Promise<void>;
    setApplicationLanguage: (applicationLanguage: Language) => Promise<void>;
    setShouldAlwaysUseSystemLanguage: (shouldAlwaysUseSystemLanguage: boolean) => Promise<void>;
}

type AppConfigStoreState = State & Actions;

const initialState: State = {
    config_version: 0,
    config_file: undefined,
    mode: 'Eco',
    auto_mining: true,
    p2pool_enabled: false,
    last_binaries_update_timestamp: '0',
    allow_telemetry: false,
    anon_id: '',
    monero_address: '',
    gpu_mining_enabled: true,
    cpu_mining_enabled: true,
};

export const useAppConfigStore = create<AppConfigStoreState>()((set) => ({
    ...initialState,
    fetchAppConfig: async () => {
        try {
            const appConfig = await invoke('get_app_config');
            set(appConfig);
        } catch (e) {
            console.error('Could not get app config: ', e);
        }
    },
    setShouldAlwaysUseSystemLanguage: async (shouldAlwaysUseSystemLanguage: boolean) => {
        set({ should_always_use_system_language: shouldAlwaysUseSystemLanguage });
        invoke('set_should_always_use_system_language', { shouldAlwaysUseSystemLanguage }).catch((e) => {
            const appStateStore = useAppStateStore.getState();
            console.error('Could not set should always use system language', e);
            appStateStore.setError('Could not change system language');
            set({ should_always_use_system_language: !shouldAlwaysUseSystemLanguage });
        });
    },
    setApplicationLanguage: async (applicationLanguage: Language) => {
        set({ application_language: applicationLanguage });
        invoke('set_application_language', { applicationLanguage }).catch((e) => {
            const appStateStore = useAppStateStore.getState();
            console.error('Could not set application language', e);
            appStateStore.setError('Could not change application language');
        });
    },
    setAllowTelemetry: async (allowTelemetry) => {
        set({ allow_telemetry: allowTelemetry });
        invoke('set_allow_telemetry', { allowTelemetry }).catch((e) => {
            const appStateStore = useAppStateStore.getState();
            console.error('Could not set telemetry mode to ', allowTelemetry, e);
            appStateStore.setError('Could not change telemetry mode');
            set({ allow_telemetry: !allowTelemetry });
        });
    },
    setCpuMiningEnabled: async (enabled) => {
        set({ cpu_mining_enabled: enabled });
        const miningState = useMiningStore.getState();
        if (miningState.cpu.mining.is_mining || miningState.gpu.mining.is_mining) {
            await miningState.pauseMining();
        }
        invoke('set_cpu_mining_enabled', { enabled })
            .then(async () => {
                if (miningState.miningInitiated) {
                    await miningState.startMining();
                }
            })
            .catch((e) => {
                const appStateStore = useAppStateStore.getState();
                console.error('Could not set CPU mining enabled', e);
                appStateStore.setError('Could not change CPU mining enabled');
                set({ cpu_mining_enabled: !enabled });

                if (
                    miningState.miningInitiated &&
                    !miningState.cpu.mining.is_mining &&
                    !miningState.gpu.mining.is_mining
                ) {
                    miningState.stopMining();
                }
            });
    },
    setGpuMiningEnabled: async (enabled) => {
        set({ gpu_mining_enabled: enabled });
        const miningState = useMiningStore.getState();
        if (miningState.cpu.mining.is_mining || miningState.gpu.mining.is_mining) {
            await miningState.pauseMining();
        }
        invoke('set_gpu_mining_enabled', { enabled })
            .then(async () => {
                if (miningState.miningInitiated) {
                    await miningState.startMining();
                }
            })
            .catch((e) => {
                const appStateStore = useAppStateStore.getState();
                console.error('Could not set GPU mining enabled', e);
                appStateStore.setError('Could not change GPU mining enabled');
                set({ gpu_mining_enabled: !enabled });

                if (
                    miningState.miningInitiated &&
                    !miningState.cpu.mining.is_mining &&
                    !miningState.gpu.mining.is_mining
                ) {
                    miningState.stopMining();
                }
            });
    },
    setP2poolEnabled: async (p2poolEnabled) => {
        set({ p2pool_enabled: p2poolEnabled });
        invoke('set_p2pool_enabled', { p2pool_enabled: p2poolEnabled }).catch((e) => {
            const appStateStore = useAppStateStore.getState();
            console.error('Could not set P2pool enabled', e);
            appStateStore.setError('Could not change P2pool enabled');
            set({ p2pool_enabled: !p2poolEnabled });
        });
    },
    setMoneroAddress: async (moneroAddress) => {
        const prevMoneroAddress = useAppConfigStore.getState().monero_address;
        set({ monero_address: moneroAddress });
        invoke('set_monero_address', { moneroAddress }).catch((e) => {
            const appStateStore = useAppStateStore.getState();
            console.error('Could not set Monero address', e);
            appStateStore.setError('Could not change Monero address');
            set({ monero_address: prevMoneroAddress });
        });
    },
    setMode: async (mode) => {
        const prevMode = useAppConfigStore.getState().mode;
        set({ mode });
        invoke('set_mode', { mode }).catch((e) => {
            const appStateStore = useAppStateStore.getState();
            console.error('Could not set mode', e);
            appStateStore.setError('Could not change mode');
            set({ mode: prevMode });
        });
    },
}));
