import { BackgroundNodeSyncUpdatePayload } from '@app/types/events-payloads';
import { create } from './create';
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
}

const initialState: NodeStoreState = {
    node_type: undefined,
    node_identity: {
        public_key: '',
        public_addresses: [],
    },
    node_connection_address: '',
};

export const useNodeStore = create<NodeStoreState>()(() => ({
    ...initialState,
}));

export const setNodeTypeState = (newState: Partial<NodeStoreState>) => {
    useNodeStore.setState((state) => ({ ...state, ...newState }));
};

export const setBackgroundNodeState = (backgroundNodeSyncLastUpdate: BackgroundNodeSyncUpdatePayload) => {
    useNodeStore.setState((currentState) => {
        const current = currentState.backgroundNodeSyncLastUpdate;
        const isEqual = deepEqual(current, backgroundNodeSyncLastUpdate);

        if (isEqual) return currentState;

        return { backgroundNodeSyncLastUpdate };
    });
};
