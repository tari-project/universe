import { create } from 'zustand';
import { BackgroundNodeSyncUpdatePayload } from '@app/types/events-payloads';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';
import { BaseNodeStatus } from '@app/types/app-status';
import { NodeIdentity, NodeType } from '@app/types/mining/node.ts';

interface NodeStoreState {
    node_type?: NodeType;
    node_identity?: NodeIdentity;
    node_connection_address?: string;
    backgroundNodeSyncLastUpdate?: BackgroundNodeSyncUpdatePayload;
    tor_entry_guards: string[];
    isNodeConnected: boolean;
    base_node_status?: BaseNodeStatus;
}

const initialState: NodeStoreState = {
    node_type: undefined,
    node_identity: {
        public_key: '',
        public_addresses: [],
    },
    node_connection_address: '',
    tor_entry_guards: [],
    isNodeConnected: false,
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

export const setBackgroundNodeState = (backgroundNodeSyncLastUpdate: BackgroundNodeSyncUpdatePayload) => {
    useNodeStore.setState((currentState) => {
        const current = currentState.backgroundNodeSyncLastUpdate;
        const isEqual = deepEqual(current, backgroundNodeSyncLastUpdate);

        if (isEqual) return currentState;

        return { backgroundNodeSyncLastUpdate };
    });
};
