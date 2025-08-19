import { create } from 'zustand';
import { AppModule, AppModuleStatus, SetupState } from './types/setup.ts';

const initialState: SetupState = {
    app_modules: {
        [AppModule.MainApp]: {
            module: AppModule.MainApp,
            status: AppModuleStatus.NotInitialized,
            errorMessages: {},
        },
        [AppModule.CpuMining]: {
            module: AppModule.CpuMining,
            status: AppModuleStatus.NotInitialized,
            errorMessages: {},
        },
        [AppModule.GpuMining]: {
            module: AppModule.GpuMining,
            status: AppModuleStatus.NotInitialized,
            errorMessages: {},
        },
        [AppModule.Wallet]: {
            module: AppModule.Wallet,
            status: AppModuleStatus.NotInitialized,
            errorMessages: {},
        },
    },
    isInitialSetupFinished: false,
    disabled_phases: [],
};
export const useSetupStore = create<SetupState>()(() => ({ ...initialState }));
