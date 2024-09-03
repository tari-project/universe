import { create } from 'zustand';
import { BaseNodeStatus } from '../types/app-status.ts';
import { persist, createJSONStorage } from 'zustand/middleware';

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
            storage: createJSONStorage(() => sessionStorage),
            partialize: (s) => ({
                block_height: s.block_height,
            }),
        }
    )
);
