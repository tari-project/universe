import { Language } from '@app/i18initializer.ts';
import {
    displayMode,
    pauseMining,
    setTheme as setUITheme,
    startMining,
    stopMining,
    useAppStateStore,
    useMiningMetricsStore,
    useMiningStore,
} from '@app/store';
import { invoke } from '@tauri-apps/api/core';
import { changeLanguage } from 'i18next';

interface Actions {
    setAllowTelemetry: (allowTelemetry: boolean) => Promise<void>;
    setCpuMiningEnabled: (enabled: boolean) => Promise<void>;
    setGpuMiningEnabled: (enabled: boolean) => Promise<void>;
    setP2poolEnabled: (p2poolEnabled: boolean) => Promise<void>;
    setMoneroAddress: (moneroAddress: string) => Promise<void>;
    setMineOnAppStart: (mineOnAppStart: boolean) => Promise<void>;
    setMode: (params: SetModeProps) => Promise<void>;
    setApplicationLanguage: (applicationLanguage: Language) => Promise<void>;
    setShouldAlwaysUseSystemLanguage: (shouldAlwaysUseSystemLanguage: boolean) => Promise<void>;
    setUseTor: (useTor: boolean) => Promise<void>;
    setShouldAutoLaunch: (shouldAutoLaunch: boolean) => Promise<void>;
    setAutoUpdate: (autoUpdate: boolean) => Promise<void>;
    setMonerodConfig: (use_monero_fail: boolean, monero_nodes: string[]) => Promise<void>;
    setTheme: (theme: displayMode) => Promise<void>;
    setVisualMode: (enabled: boolean) => void;
    setShowExperimentalSettings: (showExperimentalSettings: boolean) => Promise<void>;
    setP2poolStatsServerPort: (port: number | null) => Promise<void>;
    setPreRelease: (preRelease: boolean) => Promise<void>;
    setAudioEnabled: (audioEnabled: boolean) => Promise<void>;
}

export const setShouldAutoLaunch = async (shouldAutoLaunch) => {
    useAppConfigStore.setState({ should_auto_launch: shouldAutoLaunch });
    invoke('set_should_auto_launch', { shouldAutoLaunch }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set auto launch', e);
        appStateStore.setError('Could not change auto launch');
        useAppConfigStore.setState({ should_auto_launch: !shouldAutoLaunch });
    });
};
export const setMineOnAppStart = async (mineOnAppStart) => {
    useAppConfigStore.setState({ mine_on_app_start: mineOnAppStart });
    invoke('set_mine_on_app_start', { mineOnAppStart }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set mine on app start', e);
        appStateStore.setError('Could not change mine on app start');
        useAppConfigStore.setState({ mine_on_app_start: !mineOnAppStart });
    });
};
export const setShouldAlwaysUseSystemLanguage = async (shouldAlwaysUseSystemLanguage: boolean) => {
    useAppConfigStore.setState({ should_always_use_system_language: shouldAlwaysUseSystemLanguage });
    invoke('set_should_always_use_system_language', { shouldAlwaysUseSystemLanguage }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set should always use system language', e);
        appStateStore.setError('Could not change system language');
        useAppConfigStore.setState({ should_always_use_system_language: !shouldAlwaysUseSystemLanguage });
    });
};
export const setApplicationLanguage = async (applicationLanguage: Language) => {
    const prevApplicationLanguage = useAppConfigStore.getState().application_language;
    useAppConfigStore.setState({ application_language: applicationLanguage });
    invoke('set_application_language', { applicationLanguage })
        .then(() => {
            changeLanguage(applicationLanguage);
        })
        .catch((e) => {
            const appStateStore = useAppStateStore.getState();
            console.error('Could not set application language', e);
            appStateStore.setError('Could not change application language');
            useAppConfigStore.setState({ application_language: prevApplicationLanguage });
        });
};
export const setAllowTelemetry = async (allowTelemetry) => {
    useAppConfigStore.setState({ allow_telemetry: allowTelemetry });
    invoke('set_allow_telemetry', { allowTelemetry }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set telemetry mode to ', allowTelemetry, e);
        appStateStore.setError('Could not change telemetry mode');
        useAppConfigStore.setState({ allow_telemetry: !allowTelemetry });
    });
};
export const setCpuMiningEnabled = async (enabled) => {
    useAppConfigStore.setState({ cpu_mining_enabled: enabled });
    const miningState = useMiningStore.getState();
    const metricsState = useMiningMetricsStore.getState();
    if (metricsState.cpu_mining_status.is_mining || metricsState.gpu_mining_status.is_mining) {
        await pauseMining();
    }
    invoke('set_cpu_mining_enabled', { enabled })
        .then(async () => {
            if (miningState.miningInitiated && (enabled || metricsState.gpu_mining_status.is_mining)) {
                await startMining();
            } else {
                await stopMining();
            }
        })
        .catch((e) => {
            const appStateStore = useAppStateStore.getState();
            console.error('Could not set CPU mining enabled', e);
            appStateStore.setError('Could not change CPU mining enabled');
            useAppConfigStore.setState({ cpu_mining_enabled: !enabled });

            if (
                miningState.miningInitiated &&
                !metricsState.cpu_mining_status.is_mining &&
                !metricsState.gpu_mining_status.is_mining
            ) {
                void stopMining();
            }
        });
};
export const setGpuMiningEnabled = async (enabled) => {
    useAppConfigStore.setState({ gpu_mining_enabled: enabled });
    const miningState = useMiningStore.getState();
    const metricsState = useMiningMetricsStore.getState();
    const totalGpuDevices = metricsState.gpu_devices.length;
    const excludedDevices = miningState.excludedGpuDevices.length;
    if (metricsState.cpu_mining_status.is_mining || metricsState.cpu_mining_status.is_mining) {
        await pauseMining();
    }

    try {
        await invoke('set_gpu_mining_enabled', { enabled });
        if (miningState.miningInitiated && (metricsState.cpu_mining_status.is_mining || enabled)) {
            await startMining();
        } else {
            void stopMining();
        }
        if (enabled && excludedDevices === totalGpuDevices) {
            miningState.setExcludedGpuDevice([]);
        }
    } catch (e) {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set GPU mining enabled', e);
        appStateStore.setError('Could not change GPU mining enabled');
        useAppConfigStore.setState({ gpu_mining_enabled: !enabled });

        if (
            miningState.miningInitiated &&
            !metricsState.cpu_mining_status.is_mining &&
            !metricsState.gpu_mining_status.is_mining
        ) {
            void stopMining();
        }
    }
};
export const setP2poolEnabled = async (p2poolEnabled) => {
    useAppConfigStore.setState({ p2pool_enabled: p2poolEnabled });
    invoke('set_p2pool_enabled', { p2poolEnabled }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set P2pool enabled', e);
        appStateStore.setError('Could not change P2pool enabled');
        useAppConfigStore.setState({ p2pool_enabled: !p2poolEnabled });
    });
};
export const setMoneroAddress = async (moneroAddress) => {
    const prevMoneroAddress = useAppConfigStore.getState().monero_address;
    useAppConfigStore.setState({ monero_address: moneroAddress });
    invoke('set_monero_address', { moneroAddress }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set Monero address', e);
        appStateStore.setError('Could not change Monero address');
        useAppConfigStore.setState({ monero_address: prevMoneroAddress });
    });
};
export const setMode = async (params) => {
    const { mode, customGpuLevels, customCpuLevels } = params;
    const prevMode = useAppConfigStore.getState().mode;
    useAppConfigStore.setState({ mode, custom_max_cpu_usage: customCpuLevels, custom_max_gpu_usage: customGpuLevels });
    console.info('Setting mode', mode, customCpuLevels, customGpuLevels);
    invoke('set_mode', {
        mode,
        customCpuUsage: customCpuLevels,
        customGpuUsage: customGpuLevels,
    }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set mode', e);
        appStateStore.setError('Could not change mode');
        useAppConfigStore.setState({ mode: prevMode });
    });
};
export const setUseTor = async (useTor) => {
    useAppConfigStore.setState({ use_tor: useTor });
    invoke('set_use_tor', { useTor }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set use Tor', e);
        appStateStore.setError('Could not change Tor usage');
        useAppConfigStore.setState({ use_tor: !useTor });
    });
};
export const setAutoUpdate = async (autoUpdate) => {
    useAppConfigStore.setState({ auto_update: autoUpdate });
    invoke('set_auto_update', { autoUpdate }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set auto update', e);
        appStateStore.setError('Could not change auto update');
        useAppConfigStore.setState({ auto_update: !autoUpdate });
    });
};
export const setMonerodConfig = async (useMoneroFail, moneroNodes) => {
    const prevMoneroNodes = useAppConfigStore.getState().mmproxy_monero_nodes;
    useAppConfigStore.setState({ mmproxy_use_monero_fail: useMoneroFail, mmproxy_monero_nodes: moneroNodes });
    invoke('set_monerod_config', { useMoneroFail, moneroNodes }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set monerod config', e);
        appStateStore.setError('Could not change monerod config');
        useAppConfigStore.setState({ mmproxy_use_monero_fail: !useMoneroFail, mmproxy_monero_nodes: prevMoneroNodes });
    });
};
export const setTheme = async (themeArg) => {
    const display_mode = themeArg?.toLowerCase() as displayMode;
    const prefersDarkMode = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

    const prevTheme = useAppConfigStore.getState().display_mode;

    const uiTheme = display_mode === 'system' ? (prefersDarkMode() ? 'dark' : 'light') : display_mode;

    setUITheme(uiTheme);

    useAppConfigStore.setState({ display_mode });
    invoke('set_display_mode', { displayMode: display_mode as displayMode }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set theme', e);
        appStateStore.setError('Could not change theme');
        useAppConfigStore.setState({ display_mode: prevTheme });
    });
};
export const setVisualMode = (enabled) => {
    useAppConfigStore.setState({ visual_mode: enabled });
    invoke('set_visual_mode', { enabled }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set visual mode', e);
        appStateStore.setError('Could not change visual mode');
        useAppConfigStore.setState({ visual_mode: !enabled });
    });
};
export const setShowExperimentalSettings = async (showExperimentalSettings) => {
    useAppConfigStore.setState({ show_experimental_settings: showExperimentalSettings });
    invoke('set_show_experimental_settings', { showExperimentalSettings }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set show experimental settings', e);
        appStateStore.setError('Could not change experimental settings');
        useAppConfigStore.setState({ show_experimental_settings: !showExperimentalSettings });
    });
};
export const setP2poolStatsServerPort = async (port) => {
    useAppConfigStore.setState({ p2pool_stats_server_port: port });
    invoke('set_p2pool_stats_server_port', { port }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set p2pool stats server port', e);
        appStateStore.setError('Could not change p2pool stats server port');
        useAppConfigStore.setState({ p2pool_stats_server_port: port });
    });
};
export const setPreRelease = async (preRelease) => {
    useAppConfigStore.setState({ pre_release: preRelease });
    invoke('set_pre_release', { preRelease }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set pre release', e);
        appStateStore.setError('Could not change pre release');
        useAppConfigStore.setState({ pre_release: !preRelease });
    });
};
export const setAudioEnabled = async (audioEnabled) => {
    useAppConfigStore.setState({ audio_enabled: audioEnabled });
    invoke('set_audio_enabled', { audioEnabled }).catch((e) => {
        const appStateStore = useAppStateStore.getState();
        console.error('Could not set audio enabled', e);
        appStateStore.setError('Could not change audio enabled');
        useAppConfigStore.setState({ audio_enabled: !audioEnabled });
    });
};
