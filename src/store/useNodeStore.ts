import { create } from 'zustand';
import { BackgroundNodeSyncUpdatePayload } from '@app/types/events-payloads';
import { deepEqual } from '@app/utils/objectDeepEqual.ts';

export type NodeType = 'Local' | 'Remote' | 'RemoteUntilLocal' | 'LocalAfterRemote';
export interface NodeIdentity {
    public_key: string;
    public_addresses: string[];
}

interface NodeStoreState {
    node_type?: NodeType;
    node_identity?: NodeIdentity;
    node_connection_address?: string;
    backgroundNodeSyncLastUpdate?: BackgroundNodeSyncUpdatePayload;
    tor_entry_guards: string[];
}

const initialState: NodeStoreState = {
    node_type: undefined,
    node_identity: {
        public_key: '',
        public_addresses: [],
    },
    node_connection_address: '',
    tor_entry_guards: [],
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
