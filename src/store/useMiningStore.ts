import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BlockTimeData } from '@app/types/mining.ts';

interface State {
    displayBlockHeight?: number;
    blockTime?: BlockTimeData;
}
interface Actions {
    setDisplayBlockHeight: (displayBlockHeight: number) => void;
    setBlockTime: (blockTime: BlockTimeData) => void;
}
type MiningStoreState = State & Actions;

const initialState: State = {
    displayBlockHeight: undefined,
};

export const useMiningStore = create<MiningStoreState>()(
    persist(
        (set) => ({
            ...initialState,
            setDisplayBlockHeight: (displayBlockHeight) => set({ displayBlockHeight }),
            setBlockTime: (blockTime) => set({ blockTime }),
        }),
        {
            name: 'mining',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
