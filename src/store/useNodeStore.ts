import { t } from 'i18next';
import { create } from 'zustand';
import { addToast, removeToast } from '@app/components/ToastStack/useToastStore';
import { BackgroundNodeSyncUpdatePayload, TorFallbackPayload } from '@app/types/events-payloads';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';
import { BaseNodeStatus } from '@app/types/app-status';
import { NodeIdentity, NodeType } from '@app/types/mining/node.ts';

interface NodeStoreState {
    node_type?: NodeType;
    node_identity?: NodeIdentity;
    node_connection_address?: string;
    backgroundNodeSyncLastUpdate?: BackgroundNodeSyncUpdatePayload;
    tor_entry_guards: string[];
    tor_fallback_active: boolean;
    tor_fallback_reason: string | null;
    isNodeConnected: boolean;
    base_node_status?: BaseNodeStatus;
    moveDataConfirmed: boolean;
}

const initialState: NodeStoreState = {
    node_type: undefined,
    node_identity: {
        public_key: '',
        public_addresses: [],
    },
    node_connection_address: '',
    tor_entry_guards: [],
    tor_fallback_active: false,
    tor_fallback_reason: null,
    isNodeConnected: false,
    moveDataConfirmed: false,
    base_node_status: undefined,
};

export const useNodeStore = create<NodeStoreState>()(() => ({
    ...initialState,
}));

export const setNodeStoreState = (newState: Partial<NodeStoreState>) => {
    useNodeStore.setState((state) => ({ ...state, ...newState }));
};

export const updateNodeType = (node_type: NodeType) => {
    setNodeStoreState({ ...initialState, node_type });
};

export const setTorEntryGuards = (tor_entry_guards: string[]) => {
    setNodeStoreState({
        tor_entry_guards: tor_entry_guards.filter((e) => e.split(' ')[1] === 'up').map((e) => e.split(' ')[0]),
    });
};

export const handleTorFallback = (payload: TorFallbackPayload) => {
    const previous = useNodeStore.getState();
    const reason = payload.active ? (payload.reason ?? null) : null;
    setNodeStoreState({
        tor_fallback_active: payload.active,
        tor_fallback_reason: reason,
    });

    if (!payload.active) {
        if (previous.tor_fallback_active) {
            removeToast('tor-fallback');
        }
        return;
    }

    if (!previous.tor_fallback_active || previous.tor_fallback_reason !== reason) {
        addToast({
            id: 'tor-fallback',
            title: t('tor-unavailable-fallback', {
                ns: 'settings',
                defaultValue: 'Tor unavailable, running without it',
            }),
            text: reason ?? undefined,
            type: 'warning',
            timeout: 8000,
        });
    }
};

export const setBackgroundNodeState = (backgroundNodeSyncLastUpdate: BackgroundNodeSyncUpdatePayload) => {
    useNodeStore.setState((currentState) => {
        const current = currentState.backgroundNodeSyncLastUpdate;
        const isEqual = deepEqual(current, backgroundNodeSyncLastUpdate);

        if (isEqual) return currentState;

        return { backgroundNodeSyncLastUpdate };
    });
};

export const setMoveDataConfirmed = (moveDataConfirmed: boolean) => useNodeStore.setState({ moveDataConfirmed });
