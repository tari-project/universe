import { create } from './create';
import { BaseNodeStatus } from '../types/app-status.ts';
import { persist } from 'zustand/middleware';

interface Actions {
    setBaseNodeStatus: (baseNodeStatus?: BaseNodeStatus) => void;
}
type BaseNodeStatusStoreState = BaseNodeStatus & Actions;

const initialState: BaseNodeStatus = {
    block_height: 0,
    block_time: 0,
    is_synced: false,
};
export const useBaseNodeStatusStore = create<BaseNodeStatusStoreState>()(
    persist(
        (set) => ({
            ...initialState,
            setBaseNodeStatus: (baseNodeStatus) => set({ ...baseNodeStatus }),
        }),
        {
            name: 'base_node',
            partialize: (s) => ({
                block_height: s.block_height,
            }),
            version: 0.1,
        }
    )
);
