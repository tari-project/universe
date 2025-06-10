import { create } from 'zustand';
import { SetupState } from './types/setup.ts';

export type PhaseTitle = 'setup-core' | 'setup-local-node' | 'setup-hardware' | 'setup-wallet' | 'setup-mining';

const initialState: SetupState = {
    cpuMiningUnlocked: false,
    gpuMiningUnlocked: false,
    walletUnlocked: false,
    hardwarePhaseFinished: false,
    isInitialSetupFinished: false,
    appUnlocked: false,
    core_phase_setup_payload: undefined,
    hardware_phase_setup_payload: undefined,
    node_phase_setup_payload: undefined,
    wallet_phase_setup_payload: undefined,
    mining_phase_setup_payload: undefined,
    disabled_phases: [],
};
export const useSetupStore = create<SetupState>()(() => ({ ...initialState }));
