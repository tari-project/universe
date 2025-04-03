import { ProgressTrackerUpdatePayload } from '@app/hooks/app/useProgressEventsListener';

export type SetupTitleParams = Record<string, string>;

export interface SetupState {
    miningUnlocked: boolean;
    walletUnlocked: boolean;
    appUnlocked: boolean;
    core_phase_setup_payload?: ProgressTrackerUpdatePayload;
    hardware_phase_setup_payload?: ProgressTrackerUpdatePayload;
    remote_node_phase_setup_payload?: ProgressTrackerUpdatePayload;
    node_phase_setup_payload?: ProgressTrackerUpdatePayload;
    wallet_phase_setup_payload?: ProgressTrackerUpdatePayload;
    unknown_phase_setup_payload?: ProgressTrackerUpdatePayload;
}
