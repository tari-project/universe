import { describe, it, expect } from 'vitest';
import { setupStoreSelectors } from './setupStoreSelectors';
import { AppModule, AppModuleStatus, SetupState, AppModuleState } from '../types/setup';

const createModuleState = (module: AppModule, status: AppModuleStatus): AppModuleState => ({
    module,
    status,
    error_messages: {} as Record<string, string>,
});

const createSetupState = (
    cpuStatus: AppModuleStatus,
    gpuStatus: AppModuleStatus,
    walletStatus: AppModuleStatus
): SetupState => ({
    app_modules: {
        [AppModule.CpuMining]: createModuleState(AppModule.CpuMining, cpuStatus),
        [AppModule.GpuMining]: createModuleState(AppModule.GpuMining, gpuStatus),
        [AppModule.Wallet]: createModuleState(AppModule.Wallet, walletStatus),
    },
    isInitialSetupFinished: false,
    disabled_phases: [],
});

describe('setupStoreSelectors', () => {
    describe('selectCpuMiningModule', () => {
        it('returns CPU mining module state', () => {
            const state = createSetupState(
                AppModuleStatus.Initialized,
                AppModuleStatus.NotInitialized,
                AppModuleStatus.NotInitialized
            );

            const result = setupStoreSelectors.selectCpuMiningModule(state);
            expect(result.module).toBe(AppModule.CpuMining);
            expect(result.status).toBe(AppModuleStatus.Initialized);
        });
    });

    describe('selectGpuMiningModule', () => {
        it('returns GPU mining module state', () => {
            const state = createSetupState(
                AppModuleStatus.NotInitialized,
                AppModuleStatus.Initializing,
                AppModuleStatus.NotInitialized
            );

            const result = setupStoreSelectors.selectGpuMiningModule(state);
            expect(result.module).toBe(AppModule.GpuMining);
            expect(result.status).toBe(AppModuleStatus.Initializing);
        });
    });

    describe('selectWalletModule', () => {
        it('returns wallet module state', () => {
            const state = createSetupState(
                AppModuleStatus.NotInitialized,
                AppModuleStatus.NotInitialized,
                AppModuleStatus.Failed
            );

            const result = setupStoreSelectors.selectWalletModule(state);
            expect(result.module).toBe(AppModule.Wallet);
            expect(result.status).toBe(AppModuleStatus.Failed);
        });
    });

    describe('selectCpuMiningModuleStatus', () => {
        it('returns CPU mining module status', () => {
            const state = createSetupState(
                AppModuleStatus.Initialized,
                AppModuleStatus.NotInitialized,
                AppModuleStatus.NotInitialized
            );

            const result = setupStoreSelectors.selectCpuMiningModuleStatus(state);
            expect(result).toBe(AppModuleStatus.Initialized);
        });
    });

    describe('selectGpuMiningModuleStatus', () => {
        it('returns GPU mining module status', () => {
            const state = createSetupState(
                AppModuleStatus.NotInitialized,
                AppModuleStatus.Failed,
                AppModuleStatus.NotInitialized
            );

            const result = setupStoreSelectors.selectGpuMiningModuleStatus(state);
            expect(result).toBe(AppModuleStatus.Failed);
        });
    });

    describe('selectWalletModuleStatus', () => {
        it('returns wallet module status', () => {
            const state = createSetupState(
                AppModuleStatus.NotInitialized,
                AppModuleStatus.NotInitialized,
                AppModuleStatus.Initializing
            );

            const result = setupStoreSelectors.selectWalletModuleStatus(state);
            expect(result).toBe(AppModuleStatus.Initializing);
        });
    });

    describe('isCpuMiningModuleInitialized', () => {
        it('returns true when CPU mining is Initialized', () => {
            const state = createSetupState(
                AppModuleStatus.Initialized,
                AppModuleStatus.NotInitialized,
                AppModuleStatus.NotInitialized
            );

            expect(setupStoreSelectors.isCpuMiningModuleInitialized(state)).toBe(true);
        });

        it('returns false when CPU mining is not Initialized', () => {
            const state = createSetupState(
                AppModuleStatus.Initializing,
                AppModuleStatus.NotInitialized,
                AppModuleStatus.NotInitialized
            );

            expect(setupStoreSelectors.isCpuMiningModuleInitialized(state)).toBe(false);
        });

        it('returns false when CPU mining has Failed', () => {
            const state = createSetupState(
                AppModuleStatus.Failed,
                AppModuleStatus.NotInitialized,
                AppModuleStatus.NotInitialized
            );

            expect(setupStoreSelectors.isCpuMiningModuleInitialized(state)).toBe(false);
        });
    });

    describe('isGpuMiningModuleInitialized', () => {
        it('returns true when GPU mining is Initialized', () => {
            const state = createSetupState(
                AppModuleStatus.NotInitialized,
                AppModuleStatus.Initialized,
                AppModuleStatus.NotInitialized
            );

            expect(setupStoreSelectors.isGpuMiningModuleInitialized(state)).toBe(true);
        });

        it('returns false when GPU mining is not Initialized', () => {
            const state = createSetupState(
                AppModuleStatus.NotInitialized,
                AppModuleStatus.NotInitialized,
                AppModuleStatus.NotInitialized
            );

            expect(setupStoreSelectors.isGpuMiningModuleInitialized(state)).toBe(false);
        });
    });

    describe('isWalletModuleInitialized', () => {
        it('returns true when wallet is Initialized', () => {
            const state = createSetupState(
                AppModuleStatus.NotInitialized,
                AppModuleStatus.NotInitialized,
                AppModuleStatus.Initialized
            );

            expect(setupStoreSelectors.isWalletModuleInitialized(state)).toBe(true);
        });

        it('returns false when wallet is not Initialized', () => {
            const state = createSetupState(
                AppModuleStatus.NotInitialized,
                AppModuleStatus.NotInitialized,
                AppModuleStatus.Initializing
            );

            expect(setupStoreSelectors.isWalletModuleInitialized(state)).toBe(false);
        });
    });

    describe('isAnyModuleFailed', () => {
        it('returns true when CPU mining has failed', () => {
            const state = createSetupState(
                AppModuleStatus.Failed,
                AppModuleStatus.Initialized,
                AppModuleStatus.Initialized
            );

            expect(setupStoreSelectors.isAnyModuleFailed(state)).toBe(true);
        });

        it('returns true when GPU mining has failed', () => {
            const state = createSetupState(
                AppModuleStatus.Initialized,
                AppModuleStatus.Failed,
                AppModuleStatus.Initialized
            );

            expect(setupStoreSelectors.isAnyModuleFailed(state)).toBe(true);
        });

        it('returns true when wallet has failed', () => {
            const state = createSetupState(
                AppModuleStatus.Initialized,
                AppModuleStatus.Initialized,
                AppModuleStatus.Failed
            );

            expect(setupStoreSelectors.isAnyModuleFailed(state)).toBe(true);
        });

        it('returns true when multiple modules have failed', () => {
            const state = createSetupState(AppModuleStatus.Failed, AppModuleStatus.Failed, AppModuleStatus.Initialized);

            expect(setupStoreSelectors.isAnyModuleFailed(state)).toBe(true);
        });

        it('returns false when no modules have failed', () => {
            const state = createSetupState(
                AppModuleStatus.Initialized,
                AppModuleStatus.Initializing,
                AppModuleStatus.NotInitialized
            );

            expect(setupStoreSelectors.isAnyModuleFailed(state)).toBe(false);
        });
    });

    describe('isEveryModuleResolved', () => {
        it('returns true when all modules are Initialized', () => {
            const state = createSetupState(
                AppModuleStatus.Initialized,
                AppModuleStatus.Initialized,
                AppModuleStatus.Initialized
            );

            expect(setupStoreSelectors.isEveryModuleResolved(state)).toBe(true);
        });

        it('returns true when all modules are Failed', () => {
            const state = createSetupState(AppModuleStatus.Failed, AppModuleStatus.Failed, AppModuleStatus.Failed);

            expect(setupStoreSelectors.isEveryModuleResolved(state)).toBe(true);
        });

        it('returns true when modules are mix of Initialized and Failed', () => {
            const state = createSetupState(
                AppModuleStatus.Initialized,
                AppModuleStatus.Failed,
                AppModuleStatus.Initialized
            );

            expect(setupStoreSelectors.isEveryModuleResolved(state)).toBe(true);
        });

        it('returns false when any module is Initializing', () => {
            const state = createSetupState(
                AppModuleStatus.Initialized,
                AppModuleStatus.Initializing,
                AppModuleStatus.Initialized
            );

            expect(setupStoreSelectors.isEveryModuleResolved(state)).toBe(false);
        });

        it('returns false when any module is NotInitialized', () => {
            const state = createSetupState(
                AppModuleStatus.Initialized,
                AppModuleStatus.Initialized,
                AppModuleStatus.NotInitialized
            );

            expect(setupStoreSelectors.isEveryModuleResolved(state)).toBe(false);
        });

        it('returns false when all modules are NotInitialized', () => {
            const state = createSetupState(
                AppModuleStatus.NotInitialized,
                AppModuleStatus.NotInitialized,
                AppModuleStatus.NotInitialized
            );

            expect(setupStoreSelectors.isEveryModuleResolved(state)).toBe(false);
        });
    });
});
