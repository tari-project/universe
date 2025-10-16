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
    useWalletStore,
} from '../index.ts';
import { restartMining, startCpuMining, startGpuMining, stopCpuMining, stopGpuMining } from './miningStoreActions';
import { setError } from './appStateStoreActions.ts';
import { loadAnimation, setUITheme } from './uiStoreActions';
import { displayMode } from '../types';
import {
    BasePoolData,
    ConfigCore,
    ConfigMining,
    ConfigPools,
    ConfigUI,
    ConfigWallet,
    CpuPools,
    FeedbackPrompts,
    GpuDeviceSettings,
    GpuPools,
    PromptType,
} from '@app/types/configs.ts';
import { NodeType, updateNodeType as updateNodeTypeForNodeStore } from '../useNodeStore.ts';
import { setCurrentExchangeMinerId } from '../useExchangeStore.ts';
import { fetchExchangeContent, refreshXCContent } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { fetchExchangeList } from '@app/hooks/exchanges/fetchExchanges.ts';
import { WalletUIMode } from '@app/types/events-payloads.ts';
import { getSelectedCpuPool, getSelectedGpuPool } from '../selectors/appConfigStoreSelectors.ts';
import { setFeedbackConfigItems } from '@app/store/stores/userFeedbackStore.ts';

export const handleConfigCoreLoaded = async (coreConfig: ConfigCore) => {
    useConfigCoreStore.setState((c) => ({ ...c, ...coreConfig }));
    const buildInExchangeId = useConfigBEInMemoryStore.getState().exchange_id;
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
    useWalletStore.setState((c) => ({
        ...c,
        exchange_wxtm_addresses: walletConfig.wxtm_addresses, // This is the non-Tari address used for wXTM mode
    }));
};
export const handleConfigUILoaded = async (uiConfig: ConfigUI) => {
    setFeedbackConfigItems(uiConfig.feedback);
    const configTheme = uiConfig.display_mode?.toLowerCase();
    useConfigUIStore.setState((c) => ({ ...c, ...uiConfig, display_mode: configTheme }));
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

    console.info('Loading animation on startup after config UI is loaded.');
    await loadAnimation();
};
export const handleConfigMiningLoaded = (miningConfig: ConfigMining) => {
    useConfigMiningStore.setState((c) => ({ ...c, ...miningConfig }));
};

export const handleConfigPoolsLoaded = (poolsConfig: ConfigPools) => {
    useConfigPoolsStore.setState((c) => ({ ...c, ...poolsConfig }));
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
            useConfigCoreStore.setState((c) => ({ ...c, airdrop_tokens: airdropTokensParam }));
            isSuccessFn?.(airdropTokens);
        })
        .catch((e) => console.error('Failed to store airdrop tokens: ', e));
};
export const setAllowTelemetry = async (allowTelemetry: boolean) => {
    useConfigCoreStore.setState((c) => ({ ...c, allow_telemetry: allowTelemetry }));
    invoke('set_allow_telemetry', { allowTelemetry }).catch((e) => {
        console.error('Could not set telemetry mode to ', allowTelemetry, e);
        setError('Could not change telemetry mode');
        useConfigCoreStore.setState((c) => ({ ...c, allow_telemetry: !allowTelemetry }));
    });
};
export const setAllowNotifications = async (allowNotifications: boolean) => {
    useConfigCoreStore.setState((c) => ({ ...c, allow_notifications: allowNotifications }));
    invoke('set_allow_notifications', { allowNotifications }).catch((e) => {
        console.error('Could not set notifications mode to ', allowNotifications, e);
        setError('Could not change notifications mode');
        useConfigCoreStore.setState((c) => ({ ...c, allow_notifications: !allowNotifications }));
    });
};

export const setApplicationLanguage = async (applicationLanguage: Language) => {
    const prevApplicationLanguage = useConfigUIStore.getState().application_language;
    useConfigUIStore.setState((c) => ({ ...c, application_language: applicationLanguage }));
    invoke('set_application_language', { applicationLanguage })
        .then(() => {
            changeLanguage(applicationLanguage);
        })
        .catch((e) => {
            console.error('Could not set application language', e);
            setError('Could not change application language');
            useConfigUIStore.setState((c) => ({ ...c, application_language: prevApplicationLanguage }));
        });
};
export const setAutoUpdate = async (autoUpdate: boolean) => {
    useConfigCoreStore.setState((c) => ({ ...c, auto_update: autoUpdate }));
    invoke('set_auto_update', { autoUpdate }).catch((e) => {
        console.error('Could not set auto update', e);
        setError('Could not change auto update');
        useConfigCoreStore.setState((c) => ({ ...c, auto_update: !autoUpdate }));
    });
};
export const setCpuMiningEnabled = async (enabled: boolean) => {
    useConfigMiningStore.setState((c) => ({ ...c, cpu_mining_enabled: enabled }));
    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const isCpuMiningInitiated = useMiningStore.getState().isCpuMiningInitiated;
    const cpuMining = useMiningMetricsStore.getState().cpu_mining_status.is_mining;
    try {
        if (cpuMining || isCpuMiningInitiated) {
            await stopCpuMining();
        }
        await invoke('set_cpu_mining_enabled', { enabled });
        if (anyMiningInitiated && enabled) {
            await startCpuMining();
        } else {
            await stopCpuMining();
        }
    } catch (e) {
        console.error('Could not set CPU mining enabled', e);
        setError('Could not change CPU mining enabled');
        useConfigMiningStore.setState((c) => ({ ...c, cpu_mining_enabled: !enabled }));
        if (isCpuMiningInitiated && !cpuMining) {
            await stopCpuMining();
        }
    }
};
export const setGpuMiningEnabled = async (enabled: boolean) => {
    useConfigMiningStore.setState((c) => ({ ...c, gpu_mining_enabled: enabled }));
    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const isGpuMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;
    const gpuMining = useMiningMetricsStore.getState().gpu_mining_status.is_mining;
    const gpuDevicesSettings = Object.values(useConfigMiningStore.getState().gpu_devices_settings);
    if (gpuMining || isGpuMiningInitiated) {
        await stopGpuMining();
    }
    try {
        await invoke('set_gpu_mining_enabled', { enabled });
        if (anyMiningInitiated && enabled) {
            await startGpuMining();
        } else {
            await stopGpuMining();
        }
        if (enabled && gpuDevicesSettings.every((device) => device.is_excluded)) {
            for (const device of gpuDevicesSettings) {
                await toggleDeviceExclusion(device.device_id, false);
            }
        }
        if (!enabled && gpuDevicesSettings.some((device) => !device.is_excluded)) {
            for (const device of gpuDevicesSettings) {
                await toggleDeviceExclusion(device.device_id, true);
            }
        }
    } catch (e) {
        console.error('Could not set GPU mining enabled', e);
        setError('Could not change GPU mining enabled');
        useConfigMiningStore.setState((c) => ({ ...c, gpu_mining_enabled: !enabled }));
        if (isGpuMiningInitiated && !gpuMining) {
            await stopGpuMining();
        }
    }
};
export const setMineOnAppStart = async (mineOnAppStart: boolean) => {
    useConfigMiningStore.setState((c) => ({ ...c, mine_on_app_start: mineOnAppStart }));
    invoke('set_mine_on_app_start', { mineOnAppStart }).catch((e) => {
        console.error('Could not set mine on app start', e);
        setError('Could not change mine on app start');
        useConfigMiningStore.setState((c) => ({ ...c, mine_on_app_start: !mineOnAppStart }));
    });
};

export const setPauseOnBatteryMode = async (mode: ConfigMining['pause_on_battery_mode']) => {
    const previousMode = useConfigMiningStore.getState().pause_on_battery_mode;
    useConfigMiningStore.setState((c) => ({ ...c, pause_on_battery_mode: mode }));
    invoke('set_pause_on_battery_mode', { mode }).catch((e) => {
        console.error('Could not set pause on battery mode', e);
        setError('Could not change pause on battery mode');
        useConfigMiningStore.setState((c) => ({ ...c, pause_on_battery_mode: previousMode }));
    });
};

export const selectMiningMode = async (mode: string) => {
    console.info(`Changing mode to ${mode}...`);

    useMiningStore.setState((c) => ({ ...c, isChangingMode: true }));

    const cpu_mining_status = useMiningMetricsStore.getState().cpu_mining_status;
    const gpu_mining_status = useMiningMetricsStore.getState().gpu_mining_status;
    const wasCpuMiningInitiated = useMiningStore.getState().isCpuMiningInitiated;
    const wasGpuMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;

    if (cpu_mining_status.is_mining) {
        console.info('Stopping CPU mining...');
        await stopCpuMining();
    }

    if (gpu_mining_status.is_mining || wasGpuMiningInitiated) {
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
            useMiningStore.setState((c) => ({ ...c, isChangingMode: false }));
        });
};

export const updateCustomMiningMode = async (customCpuUsage: number, customGpuUsage: number) => {
    invoke('update_custom_mining_mode', { customCpuUsage, customGpuUsage })
        .then(() => {
            useConfigMiningStore.setState((c) => ({
                ...c,
                mining_modes: {
                    ...c.mining_modes,
                    Custom: {
                        ...c.mining_modes.Custom,
                        cpu_usage_percentage: customCpuUsage,
                        gpu_usage_percentage: customGpuUsage,
                    },
                },
            }));
        })
        .catch((e) => {
            console.error('Could not update custom mining mode', e);
            setError('Could not change custom mining mode');
        });
};

export const setMoneroAddress = async (moneroAddress: string) => {
    const prevMoneroAddress = useConfigWalletStore.getState().monero_address;
    useConfigWalletStore.setState((c) => ({ ...c, monero_address: moneroAddress }));
    useConfigWalletStore.setState((c) => ({ ...c, monero_address_is_generated: false }));
    invoke('set_monero_address', { moneroAddress })
        .then(() => {
            restartMining();
        })
        .catch((e) => {
            console.error('Could not set Monero address', e);
            setError('Could not change Monero address');
            useConfigWalletStore.setState((c) => ({ ...c, monero_address: prevMoneroAddress }));
        });
};
export const setMonerodConfig = async (useMoneroFail: boolean, moneroNodes: string[]) => {
    const prevMoneroNodes = useConfigCoreStore.getState().mmproxy_monero_nodes;
    useConfigCoreStore.setState((c) => ({
        ...c,
        mmproxy_use_monero_failover: useMoneroFail,
        mmproxy_monero_nodes: moneroNodes,
    }));
    invoke('set_monerod_config', { useMoneroFail, moneroNodes }).catch((e) => {
        console.error('Could not set monerod config', e);
        setError('Could not change monerod config');
        useConfigCoreStore.setState((c) => ({
            ...c,
            mmproxy_use_monero_failover: !useMoneroFail,
            mmproxy_monero_nodes: prevMoneroNodes,
        }));
    });
};

export const setPreRelease = async (preRelease: boolean) => {
    useConfigCoreStore.setState((c) => ({ ...c, pre_release: preRelease }));
    invoke('set_pre_release', { preRelease }).catch((e) => {
        console.error('Could not set pre release', e);
        setError('Could not change pre release');
        useConfigCoreStore.setState((c) => ({ ...c, pre_release: !preRelease }));
    });
};
export const setShouldAlwaysUseSystemLanguage = async (shouldAlwaysUseSystemLanguage: boolean) => {
    useConfigUIStore.setState((c) => ({ ...c, should_always_use_system_language: shouldAlwaysUseSystemLanguage }));
    invoke('set_should_always_use_system_language', { shouldAlwaysUseSystemLanguage }).catch((e) => {
        console.error('Could not set should always use system language', e);
        setError('Could not change system language');
        useConfigUIStore.setState((c) => ({ ...c, should_always_use_system_language: !shouldAlwaysUseSystemLanguage }));
    });
};
export const setShouldAutoLaunch = async (shouldAutoLaunch: boolean) => {
    useConfigCoreStore.setState((c) => ({ ...c, should_auto_launch: shouldAutoLaunch }));
    invoke('set_should_auto_launch', { shouldAutoLaunch }).catch((e) => {
        console.error('Could not set auto launch', e);
        setError('Could not change auto launch');
        useConfigCoreStore.setState((c) => ({ ...c, should_auto_launch: !shouldAutoLaunch }));
    });
};
export const setShowExperimentalSettings = async (showExperimentalSettings: boolean) => {
    useConfigUIStore.setState((c) => ({ ...c, show_experimental_settings: showExperimentalSettings }));
    invoke('set_show_experimental_settings', { showExperimentalSettings }).catch((e) => {
        console.error('Could not set show experimental settings', e);
        setError('Could not change experimental settings');
        useConfigUIStore.setState((c) => ({ ...c, show_experimental_settings: !showExperimentalSettings }));
    });
};

export const setDisplayMode = async (displayMode: displayMode) => {
    const previousDisplayMode = useConfigUIStore.getState().display_mode;
    useConfigUIStore.setState((c) => ({ ...c, display_mode: displayMode }));

    invoke('set_display_mode', { displayMode: displayMode as displayMode }).catch((e) => {
        console.error('Could not set theme', e);
        setError('Could not change theme');
        useConfigUIStore.setState((c) => ({ ...c, display_mode: previousDisplayMode }));
    });
};

export const setUseTor = async (useTor: boolean) => {
    useConfigCoreStore.setState((c) => ({ ...c, use_tor: useTor }));
    invoke('set_use_tor', { useTor }).catch((e) => {
        console.error('Could not set use Tor', e);
        setError('Could not change Tor usage');
        useConfigCoreStore.setState((c) => ({ ...c, use_tor: !useTor }));
    });
};
export const setVisualMode = async (enabled: boolean) => {
    useConfigUIStore.setState((c) => ({ ...c, visual_mode: enabled }));
    invoke('set_visual_mode', { enabled }).catch((e) => {
        console.error('Could not set visual mode', e);
        setError('Could not change visual mode');
        useConfigUIStore.setState((c) => ({ ...c, visual_mode: !enabled }));
    });
};
export const setNodeType = async (nodeType: NodeType) => {
    const previousNodeType = useConfigCoreStore.getState().node_type;
    useConfigCoreStore.setState((c) => ({ ...c, node_type: nodeType }));
    updateNodeTypeForNodeStore(nodeType);

    invoke('set_node_type', { nodeType: nodeType }).catch((e) => {
        console.error('Could not set node type', e);
        setError('Could not change node type');
        useConfigCoreStore.setState((c) => ({ ...c, node_type: previousNodeType }));
        updateNodeTypeForNodeStore(nodeType);
    });
};

export const fetchBackendInMemoryConfig = async () => {
    try {
        console.info('Fetching backend in memory config...');
        const appInMemoryConfig = await invoke('get_app_in_memory_config');
        if (appInMemoryConfig) {
            useConfigBEInMemoryStore.setState((c) => ({ ...c, ...appInMemoryConfig }));
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
    useConfigPoolsStore.setState((c) => ({ ...c, cpu_pool_enabled: enabled }));

    const isCpuMiningEnabled = useConfigMiningStore.getState().cpu_mining_enabled;
    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const isCpuMiningInitiated = useMiningStore.getState().isCpuMiningInitiated;
    const cpuMining = useMiningMetricsStore.getState().cpu_mining_status.is_mining;

    try {
        if (cpuMining || isCpuMiningInitiated) {
            await stopCpuMining();
        }

        await invoke('toggle_cpu_pool_mining', { enabled });

        if (anyMiningInitiated && isCpuMiningEnabled) {
            await startCpuMining();
        }
    } catch (e) {
        console.error('Could not toggle CPU pool mining', e);
        setError('Could not change CPU pool mining');
        useConfigPoolsStore.setState((c) => ({ ...c, cpu_pool_enabled: previousCpuPoolEnabledState }));
    }
};
export const toggleGpuPool = async (enabled: boolean) => {
    const previousGpuPoolEnabledState = useConfigPoolsStore.getState().gpu_pool_enabled;
    useConfigPoolsStore.setState((c) => ({ ...c, gpu_pool_enabled: enabled }));

    const isGpuMiningEnabled = useConfigMiningStore.getState().gpu_mining_enabled;
    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const isGpuMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;
    const gpuMining = useMiningMetricsStore.getState().gpu_mining_status.is_mining;

    try {
        if (gpuMining || isGpuMiningInitiated) {
            await stopGpuMining();
        }

        await invoke('toggle_gpu_pool_mining', { enabled });

        if (anyMiningInitiated && isGpuMiningEnabled) {
            await startGpuMining();
        }
    } catch (e) {
        console.error('Could not toggle GPU pool mining', e);
        setError('Could not change GPU pool mining');
        useConfigPoolsStore.setState((c) => ({ ...c, gpu_pool_enabled: previousGpuPoolEnabledState }));
    }
};

export const changeGpuPool = async (gpuPool: GpuPools) => {
    const previousGpuPool = useConfigPoolsStore.getState().current_gpu_pool;
    useConfigPoolsStore.setState((c) => ({ ...c, current_gpu_pool: gpuPool }));

    const isGpuMiningEnabled = useConfigMiningStore.getState().gpu_mining_enabled;
    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const isGpuMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;
    const gpuMining = useMiningMetricsStore.getState().gpu_mining_status.is_mining;

    try {
        if (gpuMining || isGpuMiningInitiated) {
            await stopGpuMining();
        }

        await invoke('change_gpu_pool', { gpuPool });
        console.info('GPU pool changed to:', gpuPool);

        if (anyMiningInitiated && isGpuMiningEnabled) {
            await startGpuMining();
        }
    } catch (e) {
        console.error('Could not change GPU pool', e);
        setError('Could not change GPU pool');
        useConfigPoolsStore.setState((c) => ({ ...c, current_gpu_pool: previousGpuPool }));
    }
};

export const changeCpuPool = async (cpuPool: CpuPools) => {
    const previousCpuPool = useConfigPoolsStore.getState().current_cpu_pool;
    useConfigPoolsStore.setState((c) => ({ ...c, current_cpu_pool: cpuPool }));

    const isCpuMiningEnabled = useConfigMiningStore.getState().cpu_mining_enabled;
    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const isCpuMiningInitiated = useMiningStore.getState().isCpuMiningInitiated;
    const cpuMining = useMiningMetricsStore.getState().cpu_mining_status.is_mining;

    try {
        if (cpuMining || isCpuMiningInitiated) {
            await stopCpuMining();
        }

        await invoke('change_cpu_pool', { cpuPool });
        console.info('CPU pool changed to:', cpuPool);

        if (anyMiningInitiated && isCpuMiningEnabled) {
            await startCpuMining();
        }
    } catch (e) {
        console.error('Could not change CPU pool', e);
        setError('Could not change CPU pool');
        useConfigPoolsStore.setState((c) => ({ ...c, current_cpu_pool: previousCpuPool }));
    }
};

export const changeCpuPoolConfiguration = async (updatedConfig: BasePoolData) => {
    const previousCpuPoolData = getSelectedCpuPool(useConfigPoolsStore.getState());
    const availableCpuPools = useConfigPoolsStore.getState().cpu_pools;

    const isCpuMiningEnabled = useConfigMiningStore.getState().cpu_mining_enabled;
    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const isCpuMiningInitiated = useMiningStore.getState().isCpuMiningInitiated;
    const cpuMining = useMiningMetricsStore.getState().cpu_mining_status.is_mining;

    if (!availableCpuPools) {
        console.error('No available CPU pools found');
        setError('No available CPU pools found');
        return;
    }

    const updatedCpuPoolData = {
        ...previousCpuPoolData,
        ...updatedConfig,
    };

    useConfigPoolsStore.setState((c) => ({
        ...c,
        cpu_pools: {
            ...availableCpuPools,
            [updatedCpuPoolData.pool_type]: updatedCpuPoolData,
        },
    }));

    try {
        if (cpuMining || isCpuMiningInitiated) {
            console.info('Stopping CPU mining...');
            await stopCpuMining();
        }

        await invoke('update_selected_cpu_pool_config', {
            updatedConfig: updatedCpuPoolData,
        });

        if (anyMiningInitiated && isCpuMiningEnabled) {
            console.info('Restarting CPU mining...');
            await startCpuMining();
        }
        console.info('CPU pool configuration updated successfully');
    } catch (e) {
        console.error('Could not update CPU pool configuration', e);
        setError('Could not update CPU pool configuration');
    }
};

export const changeGpuPoolConfiguration = async (updatedConfig: BasePoolData) => {
    const previousGpuPoolData = getSelectedGpuPool(useConfigPoolsStore.getState());
    const availableGpuPools = useConfigPoolsStore.getState().gpu_pools;

    const isGpuMiningEnabled = useConfigMiningStore.getState().gpu_mining_enabled;
    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const isGpuMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;
    const gpuMining = useMiningMetricsStore.getState().gpu_mining_status.is_mining;

    if (!availableGpuPools) {
        console.error('No available GPU pools found');
        setError('No available GPU pools found');
        return;
    }

    const updatedGpuPoolData = {
        ...previousGpuPoolData,
        ...updatedConfig,
    };

    useConfigPoolsStore.setState((c) => ({
        ...c,
        gpu_pools: {
            ...availableGpuPools,
            [updatedGpuPoolData.pool_type]: updatedGpuPoolData,
        },
    }));

    try {
        if (gpuMining || isGpuMiningInitiated) {
            console.info('Stopping GPU mining...');
            await stopGpuMining();
        }

        await invoke('update_selected_gpu_pool_config', {
            updatedConfig: updatedGpuPoolData,
        });

        if (anyMiningInitiated && isGpuMiningEnabled) {
            console.info('Restarting GPU mining...');
            await startGpuMining();
        }

        console.info('GPU pool configuration updated successfully');
    } catch (e) {
        console.error('Could not update GPU pool configuration', e);
        setError('Could not update GPU pool configuration');
    }
};

export const resetGpuPoolConfiguration = async (gpuPoolType: string) => {
    const isGpuMiningEnabled = useConfigMiningStore.getState().gpu_mining_enabled;
    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const isGpuMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;
    const gpuMining = useMiningMetricsStore.getState().gpu_mining_status.is_mining;

    try {
        if (gpuMining || isGpuMiningInitiated) {
            console.info('Stopping GPU mining...');
            await stopGpuMining();
        }

        await invoke('reset_gpu_pool_config', { gpuPoolType });

        if (anyMiningInitiated && isGpuMiningEnabled) {
            console.info('Restarting GPU mining...');
            await startGpuMining();
        }
    } catch (e) {
        console.error('Could not reset GPU pool configuration', e);
        setError('Could not reset GPU pool configuration');
    }
};

export const resetCpuPoolConfiguration = async (cpuPoolType: string) => {
    const isCpuMiningEnabled = useConfigMiningStore.getState().cpu_mining_enabled;
    const anyMiningInitiated =
        useMiningStore.getState().isCpuMiningInitiated || useMiningStore.getState().isGpuMiningInitiated;
    const isCpuMiningInitiated = useMiningStore.getState().isCpuMiningInitiated;
    const cpuMining = useMiningMetricsStore.getState().cpu_mining_status.is_mining;

    try {
        if (cpuMining || isCpuMiningInitiated) {
            console.info('Stopping CPU mining...');
            await stopCpuMining();
        }

        await invoke('reset_cpu_pool_config', { cpuPoolType });

        if (anyMiningInitiated && isCpuMiningEnabled) {
            console.info('Restarting CPU mining...');
            await startCpuMining();
        }
    } catch (e) {
        console.error('Could not reset CPU pool configuration', e);
        setError('Could not reset CPU pool configuration');
    }
};

export const handleWalletUIChanged = (mode: WalletUIMode) => {
    useConfigUIStore.setState((c) => ({ ...c, wallet_ui_mode: mode }));
};

export const handleGpuDevicesSettingsUpdated = (gpuDevicesSettings: Record<number, GpuDeviceSettings>) => {
    useConfigMiningStore.setState((c) => ({ ...c, gpu_devices_settings: gpuDevicesSettings }));
};

export const toggleDeviceExclusion = async (deviceIndex: number, excluded: boolean) => {
    try {
        const wasGpuMiningInitiated = useMiningStore.getState().isGpuMiningInitiated;
        const metricsState = useMiningMetricsStore.getState();
        if (metricsState.gpu_mining_status.is_mining || wasGpuMiningInitiated) {
            console.info('Stoping mining...');
            await stopGpuMining();
        }
        await invoke('toggle_device_exclusion', { deviceIndex, excluded });
        const devices = useConfigMiningStore.getState().gpu_devices_settings;
        const updatedDevices = { ...devices, [deviceIndex]: { ...devices[deviceIndex], is_excluded: excluded } };
        useConfigMiningStore.setState((c) => ({ ...c, gpu_devices_settings: updatedDevices }));

        const isAllExcluded = Object.values(updatedDevices).every((device) => device.is_excluded);
        if (isAllExcluded) {
            setGpuMiningEnabled(false);
        }
        if (wasGpuMiningInitiated) {
            console.info('Restarting mining...');
            await startGpuMining();
        }
        useMiningStore.setState((c) => ({ ...c, isExcludingGpuDevices: false }));
    } catch (e) {
        console.error('Could not set excluded gpu device: ', e);
        setError(e as string);
    }
};

export const handleFeedbackFields = (feedbackType: PromptType, feedback_sent: boolean) => {
    const current = useConfigUIStore.getState().feedback;
    const now = Date.now();
    const updated: FeedbackPrompts = {
        [feedbackType]: {
            ...current?.[feedbackType],
            feedback_sent,
            last_dismissed: {
                secs_since_epoch: now / 1000,
            },
        },
    };
    const feedback = { ...current, ...updated };
    setFeedbackConfigItems(feedback);
    useConfigUIStore.setState({ feedback });
};
