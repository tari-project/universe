import { create } from 'zustand';
import { SetupState } from './types/setup.ts';

const initialState: SetupState = {
    cpuMiningUnlocked: false,
    gpuMiningUnlocked: false,
    walletUnlocked: false,
    isInitialSetupFinished: false,
    appUnlocked: false,
    disabled_phases: [],
};
export const useSetupStore = create<SetupState>()(() => ({ ...initialState }));
