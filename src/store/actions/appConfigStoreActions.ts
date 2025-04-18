import { invoke } from '@tauri-apps/api/core';
import i18next, { changeLanguage } from 'i18next';
import { Language } from '@app/i18initializer.ts';
import {
    AirdropTokens,
    useConfigCoreStore,
    useConfigMiningStore,
    useConfigUIStore,
    useConfigWalletStore,
    useMiningMetricsStore,
    useMiningStore,
} from '../index.ts';
import { pauseMining, restartMining, startMining, stopMining, toggleDeviceExclusion } from './miningStoreActions';
import { setError } from './appStateStoreActions.ts';
import { setUITheme } from './uiStoreActions';
import { GpuThreads } from '@app/types/app-status.ts';
import { displayMode, modeType } from '../types';
import { ConfigCore, ConfigMining, ConfigUI, ConfigWallet } from '@app/types/configs.ts';

interface SetModeProps {
    mode: modeType;
    customGpuLevels?: GpuThreads[];
    customCpuLevels?: number;
}

export const handleConfigCoreLoaded = (coreConfig: ConfigCore) => {
    useConfigCoreStore.setState(coreConfig);
};
export const handleConfigWalletLoaded = (walletConfig: ConfigWallet) => {
    useConfigWalletStore.setState(walletConfig);
};
export const handleConfigUILoaded = async (uiConfig: ConfigUI) => {
    useConfigUIStore.setState(uiConfig);
    const configTheme = uiConfig.display_mode?.toLowerCase();
    if (configTheme) {
        setUITheme(configTheme as displayMode);
    }
    try {
        if (i18next.language !== uiConfig.application_language) {
            console.info('Current language is', i18next.language);
            console.info('Changing language to', uiConfig.application_language);
            await changeLanguage(uiConfig.application_language);
        }
    } catch (e) {
        console.error('Could not set UI config:', e);
    }
};
export const handleConfigMiningLoaded = (miningConfig: ConfigMining) => {
    useConfigMiningStore.setState(miningConfig);
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
            useConfigCoreStore.setState({ airdrop_tokens: airdropTokensParam });
        })
        .catch((e) => console.error('Failed to store airdrop tokens: ', e));
};
export const setAllowTelemetry = async (allowTelemetry: boolean) => {
    useConfigCoreStore.setState({ allow_telemetry: allowTelemetry });
    invoke('set_allow_telemetry', { allowTelemetry }).catch((e) => {
        console.error('Could not set telemetry mode to ', allowTelemetry, e);
        setError('Could not change telemetry mode');
        useConfigCoreStore.setState({ allow_telemetry: !allowTelemetry });
    });
};
export const setApplicationLanguage = async (applicationLanguage: Language) => {
    const prevApplicationLanguage = useConfigUIStore.getState().application_language;
    useConfigUIStore.setState({ application_language: applicationLanguage });
    invoke('set_application_language', { applicationLanguage })
        .then(() => {
            changeLanguage(applicationLanguage);
        })
        .catch((e) => {
            console.error('Could not set application language', e);
            setError('Could not change application language');
            useConfigUIStore.setState({ application_language: prevApplicationLanguage });
        });
};
export const setAutoUpdate = async (autoUpdate: boolean) => {
    useConfigCoreStore.setState({ auto_update: autoUpdate });
    invoke('set_auto_update', { autoUpdate }).catch((e) => {
        console.error('Could not set auto update', e);
        setError('Could not change auto update');
        useConfigCoreStore.setState({ auto_update: !autoUpdate });
    });
};
export const setCpuMiningEnabled = async (enabled: boolean) => {
    useConfigMiningStore.setState({ cpu_mining_enabled: enabled });
    const miningInitiated = useMiningStore.getState().miningInitiated;
    const cpuMining = useMiningMetricsStore.getState().cpu_mining_status.is_mining;
    const gpuMining = useMiningMetricsStore.getState().gpu_mining_status.is_mining;

    if (cpuMining || gpuMining) {
        await pauseMining();
    }
    invoke('set_cpu_mining_enabled', { enabled })
        .then(async () => {
            if (miningInitiated && (enabled || gpuMining)) {
                await startMining();
            } else {
                await stopMining();
            }
        })
        .catch((e) => {
            console.error('Could not set CPU mining enabled', e);
            setError('Could not change CPU mining enabled');
            useConfigMiningStore.setState({ cpu_mining_enabled: !enabled });
            if (miningInitiated && !cpuMining && !gpuMining) {
                void stopMining();
            }
        });
};
export const setCustomStatsServerPort = async (port?: number) => {
    useConfigCoreStore.setState({ p2pool_stats_server_port: port });
    invoke('set_p2pool_stats_server_port', { port }).catch((e) => {
        console.error('Could not set p2pool stats server port', e);
        setError('Could not change p2pool stats server port');
        useConfigCoreStore.setState({ p2pool_stats_server_port: port });
    });
};
export const setGpuMiningEnabled = async (enabled: boolean) => {
    useConfigMiningStore.setState({ gpu_mining_enabled: enabled });
    const miningInitiated = useMiningStore.getState().miningInitiated;
    const cpuMining = useMiningMetricsStore.getState().cpu_mining_status.is_mining;
    const gpuMining = useMiningMetricsStore.getState().gpu_mining_status.is_mining;
    const gpuDevices = useMiningMetricsStore.getState().gpu_devices;
    if (cpuMining || gpuMining) {
        await pauseMining();
    }
    try {
        await invoke('set_gpu_mining_enabled', { enabled });
        if (miningInitiated && (cpuMining || enabled)) {
            await startMining();
        } else {
            void stopMining();
        }
        if (enabled && gpuDevices.every((device) => device.settings.is_excluded)) {
            for (const device of gpuDevices) {
                await toggleDeviceExclusion(device.device_index, false);
            }
        }
        if (!enabled && gpuDevices.some((device) => !device.settings.is_excluded)) {
            for (const device of gpuDevices) {
                await toggleDeviceExclusion(device.device_index, true);
            }
        }
    } catch (e) {
        console.error('Could not set GPU mining enabled', e);
        setError('Could not change GPU mining enabled');
        useConfigMiningStore.setState({ gpu_mining_enabled: !enabled });
        if (miningInitiated && !cpuMining && !gpuMining) {
            void stopMining();
        }
    }
};
export const setMineOnAppStart = async (mineOnAppStart: boolean) => {
    useConfigMiningStore.setState({ mine_on_app_start: mineOnAppStart });
    invoke('set_mine_on_app_start', { mineOnAppStart }).catch((e) => {
        console.error('Could not set mine on app start', e);
        setError('Could not change mine on app start');
        useConfigMiningStore.setState({ mine_on_app_start: !mineOnAppStart });
    });
};
export const setMode = async (params: SetModeProps) => {
    const { mode, customGpuLevels, customCpuLevels } = params;
    const prevMode = useConfigMiningStore.getState().mode;
    useConfigMiningStore.setState({
        mode,
        custom_max_cpu_usage: customCpuLevels,
        custom_max_gpu_usage: customGpuLevels,
    });
    console.info('Setting mode', mode, customCpuLevels, customGpuLevels);
    invoke('set_mode', { mode, customCpuUsage: customCpuLevels, customGpuUsage: customGpuLevels }).catch((e) => {
        console.error('Could not set mode', e);
        setError('Could not change mode');
        useConfigMiningStore.setState({ mode: prevMode });
    });
};
export const setMoneroAddress = async (moneroAddress: string) => {
    const prevMoneroAddress = useConfigWalletStore.getState().monero_address;
    useConfigWalletStore.setState({ monero_address: moneroAddress });
    useConfigWalletStore.setState({ monero_address_is_generated: false });
    invoke('set_monero_address', { moneroAddress })
        .then(() => {
            restartMining();
        })
        .catch((e) => {
            console.error('Could not set Monero address', e);
            setError('Could not change Monero address');
            useConfigWalletStore.setState({ monero_address: prevMoneroAddress });
        });
};
export const setMonerodConfig = async (useMoneroFail: boolean, moneroNodes: string[]) => {
    const prevMoneroNodes = useConfigCoreStore.getState().mmproxy_monero_nodes;
    useConfigCoreStore.setState({ mmproxy_use_monero_failover: useMoneroFail, mmproxy_monero_nodes: moneroNodes });
    invoke('set_monerod_config', { useMoneroFail, moneroNodes }).catch((e) => {
        console.error('Could not set monerod config', e);
        setError('Could not change monerod config');
        useConfigCoreStore.setState({
            mmproxy_use_monero_failover: !useMoneroFail,
            mmproxy_monero_nodes: prevMoneroNodes,
        });
    });
};
export const setP2poolEnabled = async (p2poolEnabled: boolean) => {
    useConfigCoreStore.setState({ is_p2pool_enabled: p2poolEnabled });
    invoke('set_p2pool_enabled', { p2poolEnabled }).catch((e) => {
        console.error('Could not set P2pool enabled', e);
        setError('Could not change P2pool enabled');
        useConfigCoreStore.setState({ is_p2pool_enabled: !p2poolEnabled });
    });
};
export const setPreRelease = async (preRelease: boolean) => {
    useConfigCoreStore.setState({ pre_release: preRelease });
    invoke('set_pre_release', { preRelease }).catch((e) => {
        console.error('Could not set pre release', e);
        setError('Could not change pre release');
        useConfigCoreStore.setState({ pre_release: !preRelease });
    });
};
export const setShouldAlwaysUseSystemLanguage = async (shouldAlwaysUseSystemLanguage: boolean) => {
    useConfigUIStore.setState({ should_always_use_system_language: shouldAlwaysUseSystemLanguage });
    invoke('set_should_always_use_system_language', { shouldAlwaysUseSystemLanguage }).catch((e) => {
        console.error('Could not set should always use system language', e);
        setError('Could not change system language');
        useConfigUIStore.setState({ should_always_use_system_language: !shouldAlwaysUseSystemLanguage });
    });
};
export const setShouldAutoLaunch = async (shouldAutoLaunch: boolean) => {
    useConfigCoreStore.setState({ should_auto_launch: shouldAutoLaunch });
    invoke('set_should_auto_launch', { shouldAutoLaunch }).catch((e) => {
        console.error('Could not set auto launch', e);
        setError('Could not change auto launch');
        useConfigCoreStore.setState({ should_auto_launch: !shouldAutoLaunch });
    });
};
export const setShowExperimentalSettings = async (showExperimentalSettings: boolean) => {
    useConfigUIStore.setState({ show_experimental_settings: showExperimentalSettings });
    invoke('set_show_experimental_settings', { showExperimentalSettings }).catch((e) => {
        console.error('Could not set show experimental settings', e);
        setError('Could not change experimental settings');
        useConfigUIStore.setState({ show_experimental_settings: !showExperimentalSettings });
    });
};

export const setDisplayMode = async (displayMode: displayMode) => {
    const previousDisplayMode = useConfigUIStore.getState().display_mode;
    useConfigUIStore.setState({ display_mode: displayMode });

    invoke('set_display_mode', { displayMode: displayMode as displayMode }).catch((e) => {
        console.error('Could not set theme', e);
        setError('Could not change theme');
        useConfigUIStore.setState({ display_mode: previousDisplayMode });
    });
};

export const setUseTor = async (useTor: boolean) => {
    useConfigCoreStore.setState({ use_tor: useTor });
    invoke('set_use_tor', { useTor }).catch((e) => {
        console.error('Could not set use Tor', e);
        setError('Could not change Tor usage');
        useConfigCoreStore.setState({ use_tor: !useTor });
    });
};
export const setVisualMode = (enabled: boolean) => {
    useConfigUIStore.setState({ visual_mode: enabled });
    invoke('set_visual_mode', { enabled }).catch((e) => {
        console.error('Could not set visual mode', e);
        setError('Could not change visual mode');
        useConfigUIStore.setState({ visual_mode: !enabled });
    });
};
