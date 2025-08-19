import { AppModule, AppModuleStatus, SetupState } from '../types/setup';

export const selectCpuMiningModule = (state: SetupState) => state.app_modules[AppModule.CpuMining];
export const selectGpuMiningModule = (state: SetupState) => state.app_modules[AppModule.GpuMining];
export const selectWalletModule = (state: SetupState) => state.app_modules[AppModule.Wallet];
export const selectMainAppModule = (state: SetupState) => state.app_modules[AppModule.MainApp];

export const selectCpuMiningModuleStatus = (state: SetupState) => selectCpuMiningModule(state).status;
export const selectGpuMiningModuleStatus = (state: SetupState) => selectGpuMiningModule(state).status;
export const selectWalletModuleStatus = (state: SetupState) => selectWalletModule(state).status;
export const selectMainAppModuleStatus = (state: SetupState) => selectMainAppModule(state).status;

export const isCpuMiningModuleInitialized = (state: SetupState) =>
    selectCpuMiningModuleStatus(state) === AppModuleStatus.Initialized;
export const isGpuMiningModuleInitialized = (state: SetupState) =>
    selectGpuMiningModuleStatus(state) === AppModuleStatus.Initialized;
export const isWalletModuleInitialized = (state: SetupState) =>
    selectWalletModuleStatus(state) === AppModuleStatus.Initialized;
export const isMainAppModuleInitialized = (state: SetupState) =>
    selectMainAppModuleStatus(state) === AppModuleStatus.Initialized;
