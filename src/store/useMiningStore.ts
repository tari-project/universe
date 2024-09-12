import { create } from './create';

import { BlockTimeData } from '@app/types/mining.ts';

interface State {
    displayBlockTime?: BlockTimeData;
    earnings?: number;
    postBlockAnimation?: boolean;
    timerPaused?: boolean;
    displayBlockHeight?: number;
    hashrateReady?: boolean;

    miningInitiated: boolean;
    miningControlsEnabled: boolean;
    isChangingMode: boolean;
}
interface Actions {
    setDisplayBlockTime: (displayBlockTime: BlockTimeData) => void;
    setDisplayBlockHeight: (displayBlockHeight: number) => void;
    setEarnings: (earnings?: number) => void;
    setPostBlockAnimation: (postBlockAnimation: boolean) => void;
    setTimerPaused: (timerPaused: boolean) => void;

    setMiningControlsEnabled: (miningControlsEnabled: boolean) => void;
    setMiningInitiated: (miningInitiated: State['miningInitiated']) => void;
    setIsChangingMode: (isChangingMode: State['isChangingMode']) => void;
}
type MiningStoreState = State & Actions;

const initialState: State = {
    displayBlockHeight: undefined,
    timerPaused: false,
    postBlockAnimation: false,
    hashrateReady: false,
    miningInitiated: false,
    isChangingMode: false,
    miningControlsEnabled: true,
};

export const useMiningStore = create<MiningStoreState>()((set) => ({
    ...initialState,
    setDisplayBlockTime: (displayBlockTime) => set({ displayBlockTime }),
    setDisplayBlockHeight: (displayBlockHeight) => set({ displayBlockHeight }),
    setEarnings: (earnings) => set({ earnings }),
    setPostBlockAnimation: (postBlockAnimation) => set({ postBlockAnimation }),
    setTimerPaused: (timerPaused) => set({ timerPaused }),

    setMiningInitiated: (miningInitiated) => set({ miningInitiated }),
    setIsChangingMode: (isChangingMode) => set({ isChangingMode }),
    setMiningControlsEnabled: (miningControlsEnabled) => set({ miningControlsEnabled }),
}));
