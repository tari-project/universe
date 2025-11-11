import { ProgressTrackerUpdatePayload, SetupPhase } from '@app/types/events-payloads';

export enum AppModule {
    CpuMining = 'CpuMining', // CPU mining
    GpuMining = 'GpuMining', // GPU mining
    Wallet = 'Wallet', // Wallet
}

export enum AppModuleStatus {
    NotInitialized = 'NotInitialized', // Default initial state
    Initializing = 'Initializing', // Waiting for specified setup phases to complete
    Initialized = 'Initialized', // All required setup phases completed
    Failed = 'Failed', // Setup phase failed, with error messages
}

export interface AppModuleState {
    module: AppModule;
    status: AppModuleStatus;
    error_messages: Record<SetupPhase, string>; // Maps SetupPhase to error message
}

export interface SetupState {
    app_modules: Record<AppModule, AppModuleState>;
    isInitialSetupFinished: boolean;
    core_phase_setup_payload?: ProgressTrackerUpdatePayload;
    cpu_mining_phase_setup_payload?: ProgressTrackerUpdatePayload;
    gpu_mining_phase_setup_payload?: ProgressTrackerUpdatePayload;
    node_phase_setup_payload?: ProgressTrackerUpdatePayload;
    wallet_phase_setup_payload?: ProgressTrackerUpdatePayload;
    disabled_phases: SetupPhase[];
}
