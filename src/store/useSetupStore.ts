import { create } from 'zustand';
import { SetupState } from './types/setup.ts';

const initialState: SetupState = {
    setupComplete: false,
    setupProgress: 0,
    setupTitle: '',
    setupTitleParams: {},
    hardwarePhaseComplete: false,
    miningUnlocked: false,
};
export const useSetupStore = create<SetupState>()(() => ({ ...initialState }));
