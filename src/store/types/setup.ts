import { ProgressTrackerUpdatePayload } from '@app/hooks/app/useProgressEventsListener';

export interface SetupState {
    cpuMiningUnlocked: boolean;
    gpuMiningUnlocked: boolean;
    walletUnlocked: boolean;
    hardwarePhaseFinished: boolean;
    isInitialSetupFinished: boolean;
    appUnlocked: boolean;
    core_phase_setup_payload?: ProgressTrackerUpdatePayload;
    hardware_phase_setup_payload?: ProgressTrackerUpdatePayload;
    node_phase_setup_payload?: ProgressTrackerUpdatePayload;
    wallet_phase_setup_payload?: ProgressTrackerUpdatePayload;
    unknown_phase_setup_payload?: ProgressTrackerUpdatePayload;
}
