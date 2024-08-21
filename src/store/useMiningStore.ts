import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BlockTimeData } from '@app/types/mining.ts';

interface State {
    blockTime?: BlockTimeData;
    displayBlockHeight?: number;
    earnings?: number;
    timerPaused?: boolean;
}
interface Actions {
    setBlockTime: (blockTime: BlockTimeData) => void;
    setDisplayBlockHeight: (displayBlockHeight: number) => void;
    setEarnings: (earnings?: number) => void;
    toggleTimerPaused: (pause?: boolean) => void;
}
type MiningStoreState = State & Actions;

const initialState: State = {
    displayBlockHeight: undefined,
    timerPaused: false,
};

export const useMiningStore = create<MiningStoreState>()(
    persist(
        (set) => ({
            ...initialState,
            setBlockTime: (blockTime) => set({ blockTime }),
            setDisplayBlockHeight: (displayBlockHeight) => set({ displayBlockHeight }),
            setEarnings: (earnings) => set({ earnings }),
            toggleTimerPaused: (pause) => set((state) => ({ timerPaused: pause || !state.timerPaused })),
        }),
        {
            name: 'mining',
            storage: createJSONStorage(() => sessionStorage),
            version: 1,
        }
    )
);
