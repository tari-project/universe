import { invoke } from '@tauri-apps/api/core';
import {
    AirdropTokens,
    setError,
    updateNodeType as updateNodeTypeForNodeStore,
    useConfigBEInMemoryStore,
} from '@app/store';
import { setCurrentExchangeMinerId } from '@app/store/useExchangeStore.ts';
import { fetchExchangeList } from '@app/hooks/exchanges/fetchExchanges.ts';
import { fetchExchangeContent } from '@app/hooks/exchanges/fetchExchangeContent.ts';

import { ConfigCore, Directory, ShutdownMode } from '@app/types/config/core.ts';

import { NodeType } from '@app/types/mining/node.ts';
import { SchedulerEvent, SchedulerEventState } from '@app/types/mining/schedule.ts';

import { useConfigCoreStore as store } from '../../stores/config/useConfigCoreStore.ts';

export const handleConfigCoreLoaded = async (coreConfig: ConfigCore) => {
    store.setState((c) => ({ ...c, ...coreConfig }));
    const buildInExchangeId = useConfigBEInMemoryStore.getState().exchange_id;
    const isAppExchangeSpecific = Boolean(buildInExchangeId !== 'universal');
    setCurrentExchangeMinerId(coreConfig.exchange_id as string);

    if (!isAppExchangeSpecific) {
        await fetchExchangeList();
    } else {
        await fetchExchangeContent(coreConfig.exchange_id as string);
    }
};
export const setAllowNotifications = async (allowNotifications: boolean) => {
    store.setState((c) => ({ ...c, allow_notifications: allowNotifications }));
    invoke('set_allow_notifications', { allowNotifications }).catch((e) => {
        console.error('Could not set notifications mode to ', allowNotifications, e);
        setError('Could not change notifications mode');
        store.setState((c) => ({ ...c, allow_notifications: !allowNotifications }));
    });
};
export const setAllowTelemetry = async (allowTelemetry: boolean) => {
    store.setState((c) => ({ ...c, allow_telemetry: allowTelemetry }));
    invoke('set_allow_telemetry', { allowTelemetry }).catch((e) => {
        console.error('Could not set telemetry mode to ', allowTelemetry, e);
        setError('Could not change telemetry mode');
        store.setState((c) => ({ ...c, allow_telemetry: !allowTelemetry }));
    });
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
            store.setState((c) => ({ ...c, airdrop_tokens: airdropTokensParam }));
            isSuccessFn?.(airdropTokens);
        })
        .catch((e) => console.error('Failed to store airdrop tokens: ', e));
};
export const setAutoUpdate = async (autoUpdate: boolean) => {
    store.setState((c) => ({ ...c, auto_update: autoUpdate }));
    invoke('set_auto_update', { autoUpdate }).catch((e) => {
        console.error('Could not set auto update', e);
        setError('Could not change auto update');
        store.setState((c) => ({ ...c, auto_update: !autoUpdate }));
    });
};
export const setMonerodConfig = async (useMoneroFail: boolean, moneroNodes: string[]) => {
    const prevMoneroNodes = store.getState().mmproxy_monero_nodes;
    store.setState((c) => ({
        ...c,
        mmproxy_use_monero_failover: useMoneroFail,
        mmproxy_monero_nodes: moneroNodes,
    }));
    invoke('set_monerod_config', { useMoneroFail, moneroNodes }).catch((e) => {
        console.error('Could not set monerod config', e);
        setError('Could not change monerod config');
        store.setState((c) => ({
            ...c,
            mmproxy_use_monero_failover: !useMoneroFail,
            mmproxy_monero_nodes: prevMoneroNodes,
        }));
    });
};
export const setNodeType = async (nodeType: NodeType) => {
    const previousNodeType = store.getState().node_type;
    store.setState((c) => ({ ...c, node_type: nodeType }));
    updateNodeTypeForNodeStore(nodeType);

    invoke('set_node_type', { nodeType: nodeType }).catch((e) => {
        console.error('Could not set node type', e);
        setError('Could not change node type');
        store.setState((c) => ({ ...c, node_type: previousNodeType }));
        updateNodeTypeForNodeStore(nodeType);
    });
};
export const setPreRelease = async (preRelease: boolean) => {
    store.setState((c) => ({ ...c, pre_release: preRelease }));
    invoke('set_pre_release', { preRelease }).catch((e) => {
        console.error('Could not set pre release', e);
        setError('Could not change pre release');
        store.setState((c) => ({ ...c, pre_release: !preRelease }));
    });
};
export const setShouldAutoLaunch = async (shouldAutoLaunch: boolean) => {
    store.setState((c) => ({ ...c, should_auto_launch: shouldAutoLaunch }));
    invoke('set_should_auto_launch', { shouldAutoLaunch }).catch((e) => {
        console.error('Could not set auto launch', e);
        setError('Could not change auto launch');
        store.setState((c) => ({ ...c, should_auto_launch: !shouldAutoLaunch }));
    });
};

export const setSchedulerEvents = async (newEvent: SchedulerEvent) => {
    const initialState = store.getState().scheduler_events;
    const updated = { ...initialState, [newEvent.id]: newEvent };
    store.setState({ scheduler_events: updated });

    let saved = false;
    invoke('add_scheduler_event', {
        eventId: newEvent.id,
        eventTime: newEvent.timing,
        eventType: newEvent.event_type,
    })
        .then(() => {
            saved = true;
        })
        .catch((e) => {
            console.error('Could not add_scheduler_event', e);
            setError('Could not add mining schedule.');
            store.setState({ scheduler_events: initialState });
            saved = false;
        });
    return saved;
};
export const setUseTor = async (useTor: boolean) => {
    store.setState((c) => ({ ...c, use_tor: useTor }));
    invoke('set_use_tor', { useTor }).catch((e) => {
        console.error('Could not set use Tor', e);
        setError('Could not change Tor usage');
        store.setState((c) => ({ ...c, use_tor: !useTor }));
    });
};

export const removeSchedulerEvent = async (eventId: string) => {
    invoke('remove_scheduler_event', { eventId })
        .then(() => {
            store.setState({ scheduler_events: null });
        })
        .catch((e) => console.error(`Could not remove scheduler event [${eventId}]: `, e));
};

export const toggleSchedulerEventPaused = async (eventId: string) => {
    const currentItems = store.getState().scheduler_events;
    const eventItem = currentItems?.[eventId];
    const isPaused = eventItem?.state === SchedulerEventState.Paused;
    if (!eventItem) return;

    if (isPaused) {
        return await invoke('resume_scheduler_event', { eventId })
            .then(() => {
                const updatedItem = { ...eventItem, state: SchedulerEventState.Active };
                store.setState({ scheduler_events: { ...currentItems, [eventId]: updatedItem } });
            })
            .catch((e) => console.error(`Could not resume scheduler event [${eventId}]: `, e));
    }

    return await invoke('pause_scheduler_event', { eventId })
        .then(() => {
            const updatedItem = { ...eventItem, state: SchedulerEventState.Paused };
            store.setState({ scheduler_events: { ...currentItems, [eventId]: updatedItem } });
        })
        .catch((e) => console.error(`Could not pause scheduler event [${eventId}]: `, e));
};

export const updateShutdownMode = async (shutdownMode: ShutdownMode) => {
    const previousShutdownMode = store.getState().shutdown_mode;
    store.setState((c) => ({ ...c, shutdown_mode: shutdownMode }));
    invoke('update_shutdown_mode_selection', { shutdownMode }).catch((e) => {
        console.error('Could not set shutdown mode', e);
        setError('Could not change shutdown mode');
        store.setState((c) => ({ ...c, shutdown_mode: previousShutdownMode }));
    });
};

export const setDirectory = async ({ directoryType, path }: Directory) => {
    const currentDirs = store.getState().directories;
    await invoke('set_custom_directory', { directoryType, path })
        .then(() => {
            const newDir = { [directoryType]: path };
            const directories = currentDirs ? { ...currentDirs, ...newDir } : newDir;
            store.setState({ directories });
        })
        .catch((e) => {
            console.error('Could not set directory directory', e);
        });
};
