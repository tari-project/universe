import { create } from './create';
import { BaseNodeStatus } from '../types/app-status.ts';

interface Actions {
    setBaseNodeStatus: (baseNodeStatus?: BaseNodeStatus) => void;
}
type BaseNodeStatusStoreState = BaseNodeStatus & Actions;

const initialState: BaseNodeStatus = {
    block_height: 0,
    block_time: 0,
    is_synced: false,
};
export const useBaseNodeStatusStore = create<BaseNodeStatusStoreState>()((set) => ({
    ...initialState,
    setBaseNodeStatus: (baseNodeStatus) => set({ ...baseNodeStatus }),
}));
