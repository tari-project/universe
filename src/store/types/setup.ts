import { ProgressTrackerUpdatePayload } from '@app/hooks/app/useProgressEventsListener';
import { SetupPhase } from '@app/types/events-payloads';

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
    mining_phase_setup_payload?: ProgressTrackerUpdatePayload;
    disabled_phases: SetupPhase[];
}
