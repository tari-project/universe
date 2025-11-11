import { create } from 'zustand';
import { AppModule, AppModuleStatus, SetupState } from './types/setup.ts';
import { SetupPhase } from '@app/types/events-payloads.ts';

const defultErrorMessages: Record<SetupPhase, string> = {
    [SetupPhase.Core]: '',
    [SetupPhase.CpuMining]: '',
    [SetupPhase.GpuMining]: '',
    [SetupPhase.Node]: '',
    [SetupPhase.Wallet]: '',
};

const initialState: SetupState = {
    app_modules: {
        [AppModule.CpuMining]: {
            module: AppModule.CpuMining,
            status: AppModuleStatus.NotInitialized,
            error_messages: defultErrorMessages,
        },
        [AppModule.GpuMining]: {
            module: AppModule.GpuMining,
            status: AppModuleStatus.NotInitialized,
            error_messages: defultErrorMessages,
        },
        [AppModule.Wallet]: {
            module: AppModule.Wallet,
            status: AppModuleStatus.NotInitialized,
            error_messages: defultErrorMessages,
        },
    },
    isInitialSetupFinished: false,
    disabled_phases: [],
};
export const useSetupStore = create<SetupState>()(() => ({ ...initialState }));
