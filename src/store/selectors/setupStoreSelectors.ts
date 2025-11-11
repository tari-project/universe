import { AppModule, AppModuleStatus, SetupState } from '../types/setup';

const selectCpuMiningModule = (state: SetupState) => state.app_modules[AppModule.CpuMining];
const selectGpuMiningModule = (state: SetupState) => state.app_modules[AppModule.GpuMining];
const selectWalletModule = (state: SetupState) => state.app_modules[AppModule.Wallet];

const selectCpuMiningModuleStatus = (state: SetupState) => selectCpuMiningModule(state).status;
const selectGpuMiningModuleStatus = (state: SetupState) => selectGpuMiningModule(state).status;
const selectWalletModuleStatus = (state: SetupState) => selectWalletModule(state).status;

const isCpuMiningModuleInitialized = (state: SetupState) =>
    selectCpuMiningModuleStatus(state) === AppModuleStatus.Initialized;
const isGpuMiningModuleInitialized = (state: SetupState) =>
    selectGpuMiningModuleStatus(state) === AppModuleStatus.Initialized;
const isWalletModuleInitialized = (state: SetupState) =>
    selectWalletModuleStatus(state) === AppModuleStatus.Initialized;

const isAnyModuleFailed = (state: SetupState) =>
    [selectCpuMiningModuleStatus, selectGpuMiningModuleStatus, selectWalletModuleStatus].some(
        (statusSelector) => statusSelector(state) === AppModuleStatus.Failed
    );
const isEveryModuleResolved = (state: SetupState) =>
    [selectCpuMiningModuleStatus, selectGpuMiningModuleStatus, selectWalletModuleStatus].every(
        (statusSelector) =>
            statusSelector(state) === AppModuleStatus.Initialized || statusSelector(state) === AppModuleStatus.Failed
    );

export const setupStoreSelectors = {
    selectCpuMiningModule,
    selectGpuMiningModule,
    selectWalletModule,
    selectCpuMiningModuleStatus,
    selectGpuMiningModuleStatus,
    selectWalletModuleStatus,
    isCpuMiningModuleInitialized,
    isGpuMiningModuleInitialized,
    isWalletModuleInitialized,
    isAnyModuleFailed,
    isEveryModuleResolved,
};
