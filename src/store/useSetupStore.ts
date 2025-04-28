import { create } from 'zustand';
import { SetupState } from './types/setup.ts';

export type PhaseTitle = 'setup-core' | 'setup-local-node' | 'setup-hardware' | 'setup-wallet' | 'setup-unknown';

const initialState: SetupState = {
    miningUnlocked: false,
    walletUnlocked: false,
    hardwarePhaseFinished: false,
    appUnlocked: false,
    core_phase_setup_payload: undefined,
    hardware_phase_setup_payload: undefined,
    remote_node_phase_setup_payload: undefined,
    node_phase_setup_payload: undefined,
    wallet_phase_setup_payload: undefined,
    unknown_phase_setup_payload: undefined,
};
export const useSetupStore = create<SetupState>()(() => ({ ...initialState }));
