import { invoke } from '@tauri-apps/api/core';
import { changeLanguage } from 'i18next';
import { Language } from '@app/i18initializer.ts';
import {
    AirdropTokens,
    sidebarTowerOffset,
    TOWER_CANVAS_ID,
    useAppConfigStore,
    useMiningMetricsStore,
    useMiningStore,
} from '../index.ts';
import { pauseMining, startMining, stopMining, setExcludedGpuDevices } from './miningStoreActions';
import { setError } from './appStateStoreActions.ts';
import { setUITheme } from './uiStoreActions';
import { GpuThreads } from '@app/types/app-status.ts';
import { displayMode, modeType } from '../types';
import { loadTowerAnimation } from '@tari-project/tari-tower';

interface SetModeProps {
    mode: modeType;
    customGpuLevels?: GpuThreads[];
    customCpuLevels?: number;
}

export const fetchAppConfig = async () => {
    try {
        const appConfig = await invoke('get_app_config');
        useAppConfigStore.setState(appConfig);
        const configTheme = appConfig.display_mode?.toLowerCase();
        const canvasElement = document.getElementById('canvas');
        if (configTheme) {
            await setTheme(configTheme as displayMode);
        }
        if (canvasElement && !appConfig.visual_mode) {
            try {
                await loadTowerAnimation({ canvasId: TOWER_CANVAS_ID, offset: sidebarTowerOffset });
            } catch (e) {
                console.error('Error at loadTowerAnimation:', e);
                useAppConfigStore.setState({ visual_mode: false });
            }
        }

        return appConfig;
    } catch (e) {
        console.error('Could not get app config:', e);
    }
};
export const setAirdropTokensInConfig = (
    airdropTokensParam: Pick<AirdropTokens, 'refreshToken' | 'token'> | undefined
) => {
    const airdropTokens = airdropTokensParam
        ? {
              token: airdropTokensParam.token,
              refresh_token: airdropTokensParam.refreshToken,
          }
        : undefined;

    invoke('set_airdrop_tokens', { airdropTokens })
        .then(() => {
            useAppConfigStore.setState({ airdrop_tokens: airdropTokensParam });
        })
        .catch((e) => console.error('Failed to store airdrop tokens: ', e));
};
export const setAllowTelemetry = async (allowTelemetry: boolean) => {
    useAppConfigStore.setState({ allow_telemetry: allowTelemetry });
    invoke('set_allow_telemetry', { allowTelemetry }).catch((e) => {
        console.error('Could not set telemetry mode to ', allowTelemetry, e);
        setError('Could not change telemetry mode');
        useAppConfigStore.setState({ allow_telemetry: !allowTelemetry });
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
            console.error('Could not set application language', e);
            setError('Could not change application language');
            useAppConfigStore.setState({ application_language: prevApplicationLanguage });
        });
};
export const setAutoUpdate = async (autoUpdate: boolean) => {
    useAppConfigStore.setState({ auto_update: autoUpdate });
    invoke('set_auto_update', { autoUpdate }).catch((e) => {
        console.error('Could not set auto update', e);
        setError('Could not change auto update');
        useAppConfigStore.setState({ auto_update: !autoUpdate });
    });
};
export const setCpuMiningEnabled = async (enabled: boolean) => {
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
            console.error('Could not set CPU mining enabled', e);
            setError('Could not change CPU mining enabled');
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
export const setCustomStatsServerPort = async (port: number | null) => {
    useAppConfigStore.setState({ p2pool_stats_server_port: port });
    invoke('set_p2pool_stats_server_port', { port }).catch((e) => {
        console.error('Could not set p2pool stats server port', e);
        setError('Could not change p2pool stats server port');
        useAppConfigStore.setState({ p2pool_stats_server_port: port });
    });
};
export const setGpuMiningEnabled = async (enabled: boolean) => {
    useAppConfigStore.setState({ gpu_mining_enabled: enabled });
    const miningState = useMiningStore.getState();
    const metricsState = useMiningMetricsStore.getState();
    const totalGpuDevices = metricsState.gpu_devices.length;
    const excludedDevices = miningState.excludedGpuDevices.length;
    if (metricsState.cpu_mining_status.is_mining || metricsState.gpu_mining_status.is_mining) {
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
            await setExcludedGpuDevices([]);
        }
    } catch (e) {
        console.error('Could not set GPU mining enabled', e);
        setError('Could not change GPU mining enabled');
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
export const setMineOnAppStart = async (mineOnAppStart: boolean) => {
    useAppConfigStore.setState({ mine_on_app_start: mineOnAppStart });
    invoke('set_mine_on_app_start', { mineOnAppStart }).catch((e) => {
        console.error('Could not set mine on app start', e);
        setError('Could not change mine on app start');
        useAppConfigStore.setState({ mine_on_app_start: !mineOnAppStart });
    });
};
export const setMode = async (params: SetModeProps) => {
    const { mode, customGpuLevels, customCpuLevels } = params;
    const prevMode = useAppConfigStore.getState().mode;
    useAppConfigStore.setState({ mode, custom_max_cpu_usage: customCpuLevels, custom_max_gpu_usage: customGpuLevels });
    console.info('Setting mode', mode, customCpuLevels, customGpuLevels);
    invoke('set_mode', { mode, customCpuUsage: customCpuLevels, customGpuUsage: customGpuLevels }).catch((e) => {
        console.error('Could not set mode', e);
        setError('Could not change mode');
        useAppConfigStore.setState({ mode: prevMode });
    });
};
export const setMoneroAddress = async (moneroAddress: string) => {
    const prevMoneroAddress = useAppConfigStore.getState().monero_address;
    useAppConfigStore.setState({ monero_address: moneroAddress });
    invoke('set_monero_address', { moneroAddress }).catch((e) => {
        console.error('Could not set Monero address', e);
        setError('Could not change Monero address');
        useAppConfigStore.setState({ monero_address: prevMoneroAddress });
    });
};
export const setMonerodConfig = async (useMoneroFail: boolean, moneroNodes: string[]) => {
    const prevMoneroNodes = useAppConfigStore.getState().mmproxy_monero_nodes;
    useAppConfigStore.setState({ mmproxy_use_monero_fail: useMoneroFail, mmproxy_monero_nodes: moneroNodes });
    invoke('set_monerod_config', { useMoneroFail, moneroNodes }).catch((e) => {
        console.error('Could not set monerod config', e);
        setError('Could not change monerod config');
        useAppConfigStore.setState({ mmproxy_use_monero_fail: !useMoneroFail, mmproxy_monero_nodes: prevMoneroNodes });
    });
};
export const setP2poolEnabled = async (p2poolEnabled: boolean) => {
    useAppConfigStore.setState({ p2pool_enabled: p2poolEnabled });
    invoke('set_p2pool_enabled', { p2poolEnabled }).catch((e) => {
        console.error('Could not set P2pool enabled', e);
        setError('Could not change P2pool enabled');
        useAppConfigStore.setState({ p2pool_enabled: !p2poolEnabled });
    });
};
export const setPreRelease = async (preRelease: boolean) => {
    useAppConfigStore.setState({ pre_release: preRelease });
    invoke('set_pre_release', { preRelease }).catch((e) => {
        console.error('Could not set pre release', e);
        setError('Could not change pre release');
        useAppConfigStore.setState({ pre_release: !preRelease });
    });
};
export const setShouldAlwaysUseSystemLanguage = async (shouldAlwaysUseSystemLanguage: boolean) => {
    useAppConfigStore.setState({ should_always_use_system_language: shouldAlwaysUseSystemLanguage });
    invoke('set_should_always_use_system_language', { shouldAlwaysUseSystemLanguage }).catch((e) => {
        console.error('Could not set should always use system language', e);
        setError('Could not change system language');
        useAppConfigStore.setState({ should_always_use_system_language: !shouldAlwaysUseSystemLanguage });
    });
};
export const setShouldAutoLaunch = async (shouldAutoLaunch: boolean) => {
    useAppConfigStore.setState({ should_auto_launch: shouldAutoLaunch });
    invoke('set_should_auto_launch', { shouldAutoLaunch }).catch((e) => {
        console.error('Could not set auto launch', e);
        setError('Could not change auto launch');
        useAppConfigStore.setState({ should_auto_launch: !shouldAutoLaunch });
    });
};
export const setShowExperimentalSettings = async (showExperimentalSettings: boolean) => {
    useAppConfigStore.setState({ show_experimental_settings: showExperimentalSettings });
    invoke('set_show_experimental_settings', { showExperimentalSettings }).catch((e) => {
        console.error('Could not set show experimental settings', e);
        setError('Could not change experimental settings');
        useAppConfigStore.setState({ show_experimental_settings: !showExperimentalSettings });
    });
};
export const setTheme = async (themeArg: displayMode) => {
    const display_mode = themeArg?.toLowerCase() as displayMode;
    const prefersDarkMode = () => window.matchMedia('(prefers-color-scheme:dark)').matches;
    const prevTheme = useAppConfigStore.getState().display_mode;
    const uiTheme = display_mode === 'system' ? (prefersDarkMode() ? 'dark' : 'light') : display_mode;
    setUITheme(uiTheme);
    useAppConfigStore.setState({ display_mode });
    const shouldUpdateConfigTheme = display_mode !== prevTheme;

    if (shouldUpdateConfigTheme) {
        invoke('set_display_mode', { displayMode: display_mode as displayMode }).catch((e) => {
            console.error('Could not set theme', e);
            setError('Could not change theme');
            useAppConfigStore.setState({ display_mode: prevTheme });
            if (prevTheme) setUITheme(prevTheme === 'system' ? (prefersDarkMode() ? 'dark' : 'light') : prevTheme);
        });
    }
};
export const setUseTor = async (useTor: boolean) => {
    useAppConfigStore.setState({ use_tor: useTor });
    invoke('set_use_tor', { useTor }).catch((e) => {
        console.error('Could not set use Tor', e);
        setError('Could not change Tor usage');
        useAppConfigStore.setState({ use_tor: !useTor });
    });
};
export const setVisualMode = (enabled: boolean) => {
    useAppConfigStore.setState({ visual_mode: enabled });
    invoke('set_visual_mode', { enabled }).catch((e) => {
        console.error('Could not set visual mode', e);
        setError('Could not change visual mode');
        useAppConfigStore.setState({ visual_mode: !enabled });
    });
};
