import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BlockTimeData } from '@app/types/mining.ts';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';

interface State {
    displayBlockTime?: BlockTimeData;
    earnings?: number;
    showFailAnimation?: boolean;
    postBlockAnimation?: boolean;
    timerPaused?: boolean;
    displayBlockHeight?: number;
}
interface Actions {
    setDisplayBlockTime: (displayBlockTime: BlockTimeData) => void;
    setDisplayBlockHeight: (displayBlockHeight: number) => void;
    setEarnings: (earnings?: number) => void;
    setPostBlockAnimation: (postBlockAnimation: boolean) => void;
    setTimerPaused: (timerPaused: boolean) => void;
    setShowFailAnimation: (showFailAnimation: boolean) => void;
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
            setShowFailAnimation: (showFailAnimation) => set({ showFailAnimation }),
        }),
        {
            name: 'mining',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (s) => ({
                displayBlockHeight: s.displayBlockHeight,
                showFailAnimation: s.showFailAnimation,
                postBlockAnimation: s.postBlockAnimation,
                timerPaused: s.timerPaused,
                earnings: s.earnings,
            }),
            version: 2,
        }
    )
);
