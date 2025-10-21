import {
    AirdropTokens,
    setError,
    updateNodeType as updateNodeTypeForNodeStore,
    useConfigBEInMemoryStore,
} from '@app/store';
import { setCurrentExchangeMinerId } from '@app/store/useExchangeStore.ts';
import { fetchExchangeList } from '@app/hooks/exchanges/fetchExchanges.ts';
import { fetchExchangeContent } from '@app/hooks/exchanges/fetchExchangeContent.ts';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import { ConfigCore } from '@app/types/config/core.ts';
import { invoke } from '@tauri-apps/api/core';
import { NodeType } from '@app/types/mining/node.ts';

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

export const setAllowNotifications = async (allowNotifications: boolean) => {
    useConfigCoreStore.setState((c) => ({ ...c, allow_notifications: allowNotifications }));
    invoke('set_allow_notifications', { allowNotifications }).catch((e) => {
        console.error('Could not set notifications mode to ', allowNotifications, e);
        setError('Could not change notifications mode');
        useConfigCoreStore.setState((c) => ({ ...c, allow_notifications: !allowNotifications }));
    });
};

export const setAllowTelemetry = async (allowTelemetry: boolean) => {
    useConfigCoreStore.setState((c) => ({ ...c, allow_telemetry: allowTelemetry }));
    invoke('set_allow_telemetry', { allowTelemetry }).catch((e) => {
        console.error('Could not set telemetry mode to ', allowTelemetry, e);
        setError('Could not change telemetry mode');
        useConfigCoreStore.setState((c) => ({ ...c, allow_telemetry: !allowTelemetry }));
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
            useConfigCoreStore.setState((c) => ({ ...c, airdrop_tokens: airdropTokensParam }));
            isSuccessFn?.(airdropTokens);
        })
        .catch((e) => console.error('Failed to store airdrop tokens: ', e));
};

export const setAutoUpdate = async (autoUpdate: boolean) => {
    useConfigCoreStore.setState((c) => ({ ...c, auto_update: autoUpdate }));
    invoke('set_auto_update', { autoUpdate }).catch((e) => {
        console.error('Could not set auto update', e);
        setError('Could not change auto update');
        useConfigCoreStore.setState((c) => ({ ...c, auto_update: !autoUpdate }));
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

export const setPreRelease = async (preRelease: boolean) => {
    useConfigCoreStore.setState((c) => ({ ...c, pre_release: preRelease }));
    invoke('set_pre_release', { preRelease }).catch((e) => {
        console.error('Could not set pre release', e);
        setError('Could not change pre release');
        useConfigCoreStore.setState((c) => ({ ...c, pre_release: !preRelease }));
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
export const setUseTor = async (useTor: boolean) => {
    useConfigCoreStore.setState((c) => ({ ...c, use_tor: useTor }));
    invoke('set_use_tor', { useTor }).catch((e) => {
        console.error('Could not set use Tor', e);
        setError('Could not change Tor usage');
        useConfigCoreStore.setState((c) => ({ ...c, use_tor: !useTor }));
    });
};
