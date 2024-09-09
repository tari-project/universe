import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { BlockTimeData } from '@app/types/mining.ts';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';

interface State {
    displayBlockTime?: BlockTimeData;
    earnings?: number;
    postBlockAnimation?: boolean;
    timerPaused?: boolean;
    miningLoading?: boolean;
    displayBlockHeight?: number;
    hashrateReady?: boolean;

    miningInitiated: boolean;
    miningControlsEnabled: boolean;
    isMiningInProgress: boolean;
    isChangingMode: boolean;
    isConnectionLostDuringMining: boolean;
    audioEnabled: boolean;
}
interface Actions {
    setDisplayBlockTime: (displayBlockTime: BlockTimeData) => void;
    setDisplayBlockHeight: (displayBlockHeight: number) => void;
    setEarnings: (earnings?: number) => void;
    setPostBlockAnimation: (postBlockAnimation: boolean) => void;
    setTimerPaused: (timerPaused: boolean) => void;

    setMiningLoading: (miningLoading: boolean) => void;
    setHashrateReady: (hashrateReady: boolean) => void;

    setMiningControlsEnabled: (miningControlsEnabled: boolean) => void;
    setMiningInitiated: (miningInitiated: State['miningInitiated']) => void;
    setIsConnectionLostDuringMining: (isConnectionLostDuringMining: State['isConnectionLostDuringMining']) => void;
    setIsMiningInProgress: (isMiningInProgress: State['isMiningInProgress']) => void;
    setIsChangingMode: (isChangingMode: State['isChangingMode']) => void;
    setAudioEnabled: (audioEnabled: State['audioEnabled']) => void;
}
type MiningStoreState = State & Actions;

const initialState: State = {
    displayBlockHeight: useBaseNodeStatusStore.getState().block_height,
    timerPaused: false,
    postBlockAnimation: false,
    miningLoading: false,
    hashrateReady: false,
    miningInitiated: false,
    isMiningInProgress: false,
    isChangingMode: false,
    isConnectionLostDuringMining: false,
    miningControlsEnabled: false,
    audioEnabled: true,
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
            setMiningLoading: (miningLoading) => set({ miningLoading, hashrateReady: !miningLoading }),
            setHashrateReady: (hashrateReady) => set({ hashrateReady }),

            setMiningInitiated: (miningInitiated) => set({ miningInitiated }),
            setIsConnectionLostDuringMining: (isConnectionLostDuringMining) => set({ isConnectionLostDuringMining }),
            setIsMiningInProgress: (isMiningInProgress) => set({ isMiningInProgress }),
            setIsChangingMode: (isChangingMode) => set({ isChangingMode }),
            setMiningControlsEnabled: (miningControlsEnabled) =>
                set((state) => ({ miningControlsEnabled: miningControlsEnabled && !state.miningLoading })),
            setAudioEnabled: (audioEnabled) => set({ audioEnabled: audioEnabled }),
        }),
        {
            name: 'mining',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (s) => ({
                timerPaused: s.timerPaused,
                miningControlsEnabled: s.miningControlsEnabled,
                miningInitiated: s.miningInitiated,
                displayBlockHeight: s.displayBlockHeight,
            }),
            version: 3,
        }
    )
);
