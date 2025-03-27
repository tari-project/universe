import { create } from 'zustand';
import { SetupState } from './types/setup.ts';

const initialState: SetupState = {
    miningUnlocked: false,
    walletUnlocked: false,
    appUnlocked: false,
    core_phase_setup_payload: undefined,
    hardware_phase_setup_payload: undefined,
    remote_node_phase_setup_payload: undefined,
    local_node_phase_setup_payload: undefined,
    wallet_phase_setup_payload: undefined,
    unknown_phase_setup_payload: undefined,
};
export const useSetupStore = create<SetupState>()(() => ({ ...initialState }));
