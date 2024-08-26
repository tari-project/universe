import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BlockTimeData } from '@app/types/mining.ts';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';

interface State {
    displayBlockTime?: BlockTimeData;
    displayBlockHeight?: number;
    earnings?: number;
    postBlockAnimation?: boolean;
    timerPaused?: boolean;
}
interface Actions {
    setDisplayBlockTime: (displayBlockTime: BlockTimeData) => void;
    setDisplayBlockHeight: (displayBlockHeight: number) => void;
    setEarnings: (earnings?: number) => void;
    setPostBlockAnimation: (postBlockAnimation: boolean) => void;
    setTimerPaused: (timerPaused: boolean) => void;
}
type MiningStoreState = State & Actions;

const initialState: State = {
    displayBlockHeight: useBaseNodeStatusStore.getState().block_height,
    timerPaused: false,
    postBlockAnimation: false,
};

export const useMiningStore = create<MiningStoreState>()(
    persist(
        (set) => ({
            ...initialState,
            setDisplayBlockTime: (displayBlockTime) => set({ displayBlockTime }),
            setDisplayBlockHeight: (displayBlockHeight) => set({ displayBlockHeight }),
            setEarnings: (earnings) => set({ earnings }),
            setPostBlockAnimation: (postBlockAnimation) => set({ postBlockAnimation }),
            setTimerPaused: (timerPaused) => set({ timerPaused }),
        }),
        {
            name: 'mining',
            storage: createJSONStorage(() => sessionStorage),
            version: 2,
        }
    )
);
