import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BlockTimeData } from '@app/types/mining.ts';

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
    toggleTimerPaused: ({ pause }: { pause?: boolean }) => void;
}
type MiningStoreState = State & Actions;

const initialState: State = {
    displayBlockHeight: undefined,
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
            toggleTimerPaused: ({ pause }) =>
                set((state) => ({ timerPaused: pause !== undefined ? pause : !state.timerPaused })),
        }),
        {
            name: 'mining',
            storage: createJSONStorage(() => sessionStorage),
            version: 1,
        }
    )
);
