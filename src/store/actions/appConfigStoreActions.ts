import { invoke } from '@tauri-apps/api/core';
import i18next, { changeLanguage } from 'i18next';
import { Language } from '@app/i18initializer.ts';
import {
    AirdropTokens,
    useConfigBEInMemoryStore,
    useConfigCoreStore,
    useConfigMiningStore,
    useConfigPoolsStore,
    useConfigUIStore,
    useConfigWalletStore,
    useMiningMetricsStore,
    useMiningStore,
} from '../index.ts';
import {
    restartMining,
    startCpuMining,
    startGpuMining,
    stopCpuMining,
    stopGpuMining,
    toggleDeviceExclusion,
} from './miningStoreActions';
import { setError } from './appStateStoreActions.ts';
import { setUITheme } from './uiStoreActions';
import { displayMode } from '../types';
import { ConfigCore, ConfigMining, ConfigPools, ConfigUI, ConfigWallet } from '@app/types/configs.ts';
import { NodeType, updateNodeType as updateNodeTypeForNodeStore } from '../useNodeStore.ts';
import { setCurrentExchangeMinerId } from '../useExchangeStore.ts';
import { fetchExchangeContent, refreshXCContent } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { fetchExchangeList } from '@app/hooks/exchanges/fetchExchanges.ts';
import { WalletUIMode } from '@app/types/events-payloads.ts';

export const handleConfigCoreLoaded = async (coreConfig: ConfigCore) => {
    useConfigCoreStore.setState((c) => ({ ...c, ...coreConfig }));
    const buildInExchangeId = useConfigBEInMemoryStore.getState().exchangeId;
    const isAppExchangeSpecific = Boolean(buildInExchangeId !== 'universal');
    setCurrentExchangeMinerId(coreConfig.exchange_id as string);

    if (!isAppExchangeSpecific) {
        await fetchExchangeList();
    } else {
        await fetchExchangeContent(coreConfig.exchange_id as string);
    }
};
export const handleConfigWalletLoaded = (walletConfig: ConfigWallet) => {
    useConfigWalletStore.setState((c) => ({ ...c, ...walletConfig }));
};
export const handleConfigUILoaded = async (uiConfig: ConfigUI) => {
    useConfigUIStore.setState((c) => ({ ...c, ...uiConfig }));
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
    useConfigMiningStore.setState((c) => ({ ...c, ...miningConfig }));
    useMiningStore.setState({ miningTime: miningConfig.mining_time });
};

export const handleConfigPoolsLoaded = (poolsConfig: ConfigPools) => {
    useConfigPoolsStore.setState((c) => ({ ...c, ...poolsConfig }));
};

export const handleMiningTimeUpdate = (miningTime: number) => {
    useConfigMiningStore.setState({ mining_time: miningTime });
    useMiningStore.setState({ miningTime });
};

export const setAirdropTokensInConfig = (
    airdropTokensParam: Pick<AirdropTokens, 'refreshToken' | 'token'> | undefined,
    isSuccessFn?: (airdropTokens: { token: string; refresh_token: string } | undefined) => void
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
            isSuccessFn?.(airdropTokens);
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
export const setAllowNotifications = async (allowNotifications: boolean) => {
    useConfigCoreStore.setState({ allow_notifications: allowNotifications });
    invoke('set_allow_notifications', { allowNotifications }).catch((e) => {
        console.error('Could not set notifications mode to ', allowNotifications, e);
        setError('Could not change notifications mode');
        useConfigCoreStore.setState({ allow_notifications: !allowNotifications });
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
    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const cpuMining = useMiningMetricsStore.getState().cpu_mining_status.is_mining;
    if (cpuMining) {
        await stopCpuMining();
    }
    invoke('set_cpu_mining_enabled', { enabled })
        .then(async () => {
            if (anyMiningInitiated && enabled) {
                await startCpuMining();
            } else {
                await stopCpuMining();
            }
        })
        .catch((e) => {
            console.error('Could not set CPU mining enabled', e);
            setError('Could not change CPU mining enabled');
            useConfigMiningStore.setState({ cpu_mining_enabled: !enabled });
            if (useMiningStore.getState().isCpuMiningInitiated && !cpuMining) {
                void stopCpuMining();
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
    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const gpuMining = useMiningMetricsStore.getState().gpu_mining_status.is_mining;
    const gpuDevices = useMiningMetricsStore.getState().gpu_devices;
    if (gpuMining) {
        await stopGpuMining();
    }
    try {
        await invoke('set_gpu_mining_enabled', { enabled });
        if (anyMiningInitiated && enabled) {
            await startGpuMining();
        } else {
            void stopGpuMining();
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
        if (useMiningStore.getState().isGpuMiningInitiated && !gpuMining) {
            void stopGpuMining();
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
// export const changeMiningMode = async (params: ChangeMiningModeArgs) => {
//     const { mode, customGpuLevels, customCpuLevels } = params;
//     console.info(`Changing mode to ${mode}...`);

//     const cpu_mining_status = useMiningMetricsStore.getState().cpu_mining_status;
//     const gpu_mining_status = useMiningMetricsStore.getState().gpu_mining_status;

//     useMiningStore.setState({ isChangingMode: true });
//     handleMiningModeChange();
//     const wasCpuMiningInitiated = useMiningStore.getState().isCpuMiningInitiated;
//     const wasGpuMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;

//     if (cpu_mining_status.is_mining || gpu_mining_status.is_mining) {
//         console.info('Pausing mining...');
//         await stopMining();
//     }

//     const parsedMax = getParsedMaxLevels(useMiningStore.getState().maxAvailableThreads);

//     let cpu = customCpuLevels;
//     let gpu = customGpuLevels;

//     switch (mode) {
//         case 'Eco': {
//             cpu = parsedMax.eco_mode_max_cpu_usage;
//             gpu = parsedMax.eco_mode_max_gpu_usage;
//             break;
//         }
//         case 'Ludicrous': {
//             cpu = parsedMax.ludicrous_mode_max_cpu_usage;
//             gpu = parsedMax.ludicrous_mode_max_gpu_usage;
//             break;
//         }
//     }

//     try {
//         await setMode({
//             mode: mode as MiningModeType,
//             customCpuLevels: cpu,
//             customGpuLevels: gpu,
//         });
//         console.info(`Mode changed to ${mode}`);
//         if (wasCpuMiningInitiated) {
//             await startCpuMining();
//         }

//         if (wasGpuMiningInitiated) {
//             await startGpuMining();
//         }
//     } catch (e) {
//         console.error('Failed to change mode: ', e);
//     } finally {
//         useMiningStore.setState({ isChangingMode: false });
//     }
// };

export const selectMiningMode = async (mode: string) => {
    console.info(`Changing mode to ${mode}...`);

    useMiningStore.setState({ isChangingMode: true });
    //     handleMiningModeChange();

    const cpu_mining_status = useMiningMetricsStore.getState().cpu_mining_status;
    const gpu_mining_status = useMiningMetricsStore.getState().gpu_mining_status;
    const wasCpuMiningInitiated = useMiningStore.getState().isCpuMiningInitiated;
    const wasGpuMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;

    if (cpu_mining_status.is_mining) {
        console.info('Stopping CPU mining...');
        await stopCpuMining();
    }

    if (gpu_mining_status.is_mining) {
        console.info('Stopping GPU mining...');
        await stopGpuMining();
    }

    invoke('select_mining_mode', { mode })
        .then(() => {
            useConfigMiningStore.setState((c) => ({ ...c, selected_mining_mode: mode }));
            if (wasCpuMiningInitiated) {
                console.info('Restarting CPU mining...');
                startCpuMining();
            }

            if (wasGpuMiningInitiated) {
                console.info('Restarting GPU mining...');
                startGpuMining();
            }
        })
        .catch((e) => {
            console.error('Could not select mining mode', e);
            setError('Could not change mining mode');
        })
        .finally(() => {
            useMiningStore.setState({ isChangingMode: false });
        });
};

export const updateCustomMiningMode = async (customCpuUsage: number, customGpuUsage: number) => {
    invoke('update_custom_mining_mode', { customCpuUsage, customGpuUsage })
        .then(() => {
            useConfigMiningStore.setState((c) => ({
                ...c,
                custom_max_cpu_usage: customCpuUsage,
                custom_max_gpu_usage: customGpuUsage,
            }));
        })
        .catch((e) => {
            console.error('Could not update custom mining mode', e);
            setError('Could not change custom mining mode');
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
    });
};
export const setNodeType = async (nodeType: NodeType) => {
    const previousNodeType = useConfigCoreStore.getState().node_type;
    useConfigCoreStore.setState({ node_type: nodeType });
    updateNodeTypeForNodeStore(nodeType);

    invoke('set_node_type', { nodeType: nodeType }).catch((e) => {
        console.error('Could not set node type', e);
        setError('Could not change node type');
        useConfigCoreStore.setState({ node_type: previousNodeType });
        updateNodeTypeForNodeStore(nodeType);
    });
};

export const fetchBackendInMemoryConfig = async () => {
    try {
        const appInMemoryConfig = await invoke('get_app_in_memory_config');
        if (appInMemoryConfig) {
            useConfigBEInMemoryStore.setState({ ...appInMemoryConfig });
        }
    } catch (e) {
        console.error('Could not fetch backend in memory config', e);
    }
};

export const handleExchangeIdChanged = async (payload: string) => {
    setCurrentExchangeMinerId(payload);
    await refreshXCContent(payload);
};

export const toggleCpuPool = async (enabled: boolean) => {
    const previousCpuPoolEnabledState = useConfigPoolsStore.getState().cpu_pool_enabled;
    useConfigPoolsStore.setState({ cpu_pool_enabled: enabled });

    const isCpuMiningEnabled = useConfigMiningStore.getState().cpu_mining_enabled;
    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const cpuMining = useMiningMetricsStore.getState().cpu_mining_status.is_mining;
    if (cpuMining) {
        await stopCpuMining();
    }

    invoke('toggle_cpu_pool_mining', { enabled })
        .then(async () => {
            if (anyMiningInitiated && isCpuMiningEnabled) {
                await startCpuMining();
            } else {
                await stopCpuMining();
            }
        })
        .catch((e) => {
            console.error('Could not toggle CPU pool mining', e);
            setError('Could not change CPU pool mining');
            useConfigPoolsStore.setState({ cpu_pool_enabled: previousCpuPoolEnabledState });
            if (useMiningStore.getState().isCpuMiningInitiated && !cpuMining) {
                void stopCpuMining();
            }
        });
};
export const toggleGpuPool = async (enabled: boolean) => {
    const previousGpuPoolEnabledState = useConfigPoolsStore.getState().gpu_pool_enabled;
    useConfigPoolsStore.setState({ gpu_pool_enabled: enabled });

    const isGpuMiningEnabled = useConfigMiningStore.getState().gpu_mining_enabled;
    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const gpuMining = useMiningMetricsStore.getState().gpu_mining_status.is_mining;

    if (gpuMining) {
        await stopGpuMining();
    }

    invoke('toggle_gpu_pool_mining', { enabled })
        .then(async () => {
            if (anyMiningInitiated && isGpuMiningEnabled) {
                await startGpuMining();
            } else {
                await stopGpuMining();
            }
        })
        .catch((e) => {
            console.error('Could not toggle GPU pool mining', e);
            setError('Could not change GPU pool mining');
            useConfigPoolsStore.setState({ gpu_pool_enabled: previousGpuPoolEnabledState });
            if (useMiningStore.getState().isGpuMiningInitiated && !gpuMining) {
                void stopGpuMining();
            }
        });
};

export const handleWalletUIChanged = (mode: WalletUIMode) => {
    useConfigUIStore.setState({ wallet_ui_mode: mode });
};
