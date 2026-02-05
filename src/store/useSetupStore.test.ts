import { describe, it, expect, beforeEach } from 'vitest';
import { useSetupStore } from './useSetupStore';
import { AppModule, AppModuleStatus } from './types/setup';
import { SetupPhase } from '@app/types/events-payloads';

describe('useSetupStore', () => {
    beforeEach(() => {
        useSetupStore.setState({
            app_modules: {
                [AppModule.CpuMining]: {
                    module: AppModule.CpuMining,
                    status: AppModuleStatus.NotInitialized,
                    error_messages: {
                        [SetupPhase.Core]: '',
                        [SetupPhase.CpuMining]: '',
                        [SetupPhase.GpuMining]: '',
                        [SetupPhase.Node]: '',
                        [SetupPhase.Wallet]: '',
                    },
                },
                [AppModule.GpuMining]: {
                    module: AppModule.GpuMining,
                    status: AppModuleStatus.NotInitialized,
                    error_messages: {
                        [SetupPhase.Core]: '',
                        [SetupPhase.CpuMining]: '',
                        [SetupPhase.GpuMining]: '',
                        [SetupPhase.Node]: '',
                        [SetupPhase.Wallet]: '',
                    },
                },
                [AppModule.Wallet]: {
                    module: AppModule.Wallet,
                    status: AppModuleStatus.NotInitialized,
                    error_messages: {
                        [SetupPhase.Core]: '',
                        [SetupPhase.CpuMining]: '',
                        [SetupPhase.GpuMining]: '',
                        [SetupPhase.Node]: '',
                        [SetupPhase.Wallet]: '',
                    },
                },
            },
            isInitialSetupFinished: false,
            disabled_phases: [],
        });
    });

    describe('initial state', () => {
        it('has isInitialSetupFinished as false', () => {
            expect(useSetupStore.getState().isInitialSetupFinished).toBe(false);
        });

        it('has empty disabled_phases', () => {
            expect(useSetupStore.getState().disabled_phases).toEqual([]);
        });

        it('has CpuMining module not initialized', () => {
            expect(useSetupStore.getState().app_modules[AppModule.CpuMining].status).toBe(
                AppModuleStatus.NotInitialized
            );
        });

        it('has GpuMining module not initialized', () => {
            expect(useSetupStore.getState().app_modules[AppModule.GpuMining].status).toBe(
                AppModuleStatus.NotInitialized
            );
        });

        it('has Wallet module not initialized', () => {
            expect(useSetupStore.getState().app_modules[AppModule.Wallet].status).toBe(AppModuleStatus.NotInitialized);
        });
    });

    describe('app_modules structure', () => {
        it('has correct module field for CpuMining', () => {
            expect(useSetupStore.getState().app_modules[AppModule.CpuMining].module).toBe(AppModule.CpuMining);
        });

        it('has correct module field for GpuMining', () => {
            expect(useSetupStore.getState().app_modules[AppModule.GpuMining].module).toBe(AppModule.GpuMining);
        });

        it('has correct module field for Wallet', () => {
            expect(useSetupStore.getState().app_modules[AppModule.Wallet].module).toBe(AppModule.Wallet);
        });

        it('has error_messages for all phases', () => {
            const cpuModule = useSetupStore.getState().app_modules[AppModule.CpuMining];
            expect(cpuModule.error_messages[SetupPhase.Core]).toBe('');
            expect(cpuModule.error_messages[SetupPhase.CpuMining]).toBe('');
            expect(cpuModule.error_messages[SetupPhase.GpuMining]).toBe('');
            expect(cpuModule.error_messages[SetupPhase.Node]).toBe('');
            expect(cpuModule.error_messages[SetupPhase.Wallet]).toBe('');
        });
    });

    describe('isInitialSetupFinished state', () => {
        it('can set to true', () => {
            useSetupStore.setState({ isInitialSetupFinished: true });
            expect(useSetupStore.getState().isInitialSetupFinished).toBe(true);
        });

        it('can set back to false', () => {
            useSetupStore.setState({ isInitialSetupFinished: true });
            useSetupStore.setState({ isInitialSetupFinished: false });
            expect(useSetupStore.getState().isInitialSetupFinished).toBe(false);
        });
    });

    describe('disabled_phases state', () => {
        it('can set disabled phases', () => {
            useSetupStore.setState({ disabled_phases: [SetupPhase.GpuMining] });
            expect(useSetupStore.getState().disabled_phases).toContain(SetupPhase.GpuMining);
        });

        it('can set multiple disabled phases', () => {
            useSetupStore.setState({
                disabled_phases: [SetupPhase.GpuMining, SetupPhase.CpuMining],
            });
            const phases = useSetupStore.getState().disabled_phases;
            expect(phases).toHaveLength(2);
            expect(phases).toContain(SetupPhase.GpuMining);
            expect(phases).toContain(SetupPhase.CpuMining);
        });

        it('can clear disabled phases', () => {
            useSetupStore.setState({ disabled_phases: [SetupPhase.Node] });
            useSetupStore.setState({ disabled_phases: [] });
            expect(useSetupStore.getState().disabled_phases).toEqual([]);
        });
    });

    describe('module status updates', () => {
        it('can update CpuMining module to Initialized', () => {
            useSetupStore.setState((state) => ({
                app_modules: {
                    ...state.app_modules,
                    [AppModule.CpuMining]: {
                        ...state.app_modules[AppModule.CpuMining],
                        status: AppModuleStatus.Initialized,
                    },
                },
            }));
            expect(useSetupStore.getState().app_modules[AppModule.CpuMining].status).toBe(AppModuleStatus.Initialized);
        });

        it('can update GpuMining module to Failed', () => {
            useSetupStore.setState((state) => ({
                app_modules: {
                    ...state.app_modules,
                    [AppModule.GpuMining]: {
                        ...state.app_modules[AppModule.GpuMining],
                        status: AppModuleStatus.Failed,
                    },
                },
            }));
            expect(useSetupStore.getState().app_modules[AppModule.GpuMining].status).toBe(AppModuleStatus.Failed);
        });

        it('can update Wallet module to Initialized', () => {
            useSetupStore.setState((state) => ({
                app_modules: {
                    ...state.app_modules,
                    [AppModule.Wallet]: {
                        ...state.app_modules[AppModule.Wallet],
                        status: AppModuleStatus.Initialized,
                    },
                },
            }));
            expect(useSetupStore.getState().app_modules[AppModule.Wallet].status).toBe(AppModuleStatus.Initialized);
        });

        it('preserves other module states when updating one', () => {
            // Update CPU to Initialized
            useSetupStore.setState((state) => ({
                app_modules: {
                    ...state.app_modules,
                    [AppModule.CpuMining]: {
                        ...state.app_modules[AppModule.CpuMining],
                        status: AppModuleStatus.Initialized,
                    },
                },
            }));

            // Update GPU to Initialized
            useSetupStore.setState((state) => ({
                app_modules: {
                    ...state.app_modules,
                    [AppModule.GpuMining]: {
                        ...state.app_modules[AppModule.GpuMining],
                        status: AppModuleStatus.Initialized,
                    },
                },
            }));

            // Both should be Initialized
            expect(useSetupStore.getState().app_modules[AppModule.CpuMining].status).toBe(AppModuleStatus.Initialized);
            expect(useSetupStore.getState().app_modules[AppModule.GpuMining].status).toBe(AppModuleStatus.Initialized);
            // Wallet should still be NotInitialized
            expect(useSetupStore.getState().app_modules[AppModule.Wallet].status).toBe(AppModuleStatus.NotInitialized);
        });
    });

    describe('error messages updates', () => {
        it('can set error message for a phase', () => {
            useSetupStore.setState((state) => ({
                app_modules: {
                    ...state.app_modules,
                    [AppModule.GpuMining]: {
                        ...state.app_modules[AppModule.GpuMining],
                        error_messages: {
                            ...state.app_modules[AppModule.GpuMining].error_messages,
                            [SetupPhase.GpuMining]: 'GPU not detected',
                        },
                    },
                },
            }));

            expect(useSetupStore.getState().app_modules[AppModule.GpuMining].error_messages[SetupPhase.GpuMining]).toBe(
                'GPU not detected'
            );
        });
    });

    describe('complete initialization flow', () => {
        it('tracks all modules becoming initialized', () => {
            // All start as NotInitialized
            expect(useSetupStore.getState().app_modules[AppModule.CpuMining].status).toBe(
                AppModuleStatus.NotInitialized
            );
            expect(useSetupStore.getState().app_modules[AppModule.GpuMining].status).toBe(
                AppModuleStatus.NotInitialized
            );
            expect(useSetupStore.getState().app_modules[AppModule.Wallet].status).toBe(AppModuleStatus.NotInitialized);

            // Initialize all
            [AppModule.CpuMining, AppModule.GpuMining, AppModule.Wallet].forEach((module) => {
                useSetupStore.setState((state) => ({
                    app_modules: {
                        ...state.app_modules,
                        [module]: {
                            ...state.app_modules[module],
                            status: AppModuleStatus.Initialized,
                        },
                    },
                }));
            });

            // All should be Initialized
            expect(useSetupStore.getState().app_modules[AppModule.CpuMining].status).toBe(AppModuleStatus.Initialized);
            expect(useSetupStore.getState().app_modules[AppModule.GpuMining].status).toBe(AppModuleStatus.Initialized);
            expect(useSetupStore.getState().app_modules[AppModule.Wallet].status).toBe(AppModuleStatus.Initialized);
        });

        it('tracks partial initialization with failures', () => {
            // CPU succeeds
            useSetupStore.setState((state) => ({
                app_modules: {
                    ...state.app_modules,
                    [AppModule.CpuMining]: {
                        ...state.app_modules[AppModule.CpuMining],
                        status: AppModuleStatus.Initialized,
                    },
                },
            }));

            // GPU fails
            useSetupStore.setState((state) => ({
                app_modules: {
                    ...state.app_modules,
                    [AppModule.GpuMining]: {
                        ...state.app_modules[AppModule.GpuMining],
                        status: AppModuleStatus.Failed,
                        error_messages: {
                            ...state.app_modules[AppModule.GpuMining].error_messages,
                            [SetupPhase.GpuMining]: 'No compatible GPU found',
                        },
                    },
                },
            }));

            // Wallet succeeds
            useSetupStore.setState((state) => ({
                app_modules: {
                    ...state.app_modules,
                    [AppModule.Wallet]: {
                        ...state.app_modules[AppModule.Wallet],
                        status: AppModuleStatus.Initialized,
                    },
                },
            }));

            expect(useSetupStore.getState().app_modules[AppModule.CpuMining].status).toBe(AppModuleStatus.Initialized);
            expect(useSetupStore.getState().app_modules[AppModule.GpuMining].status).toBe(AppModuleStatus.Failed);
            expect(useSetupStore.getState().app_modules[AppModule.Wallet].status).toBe(AppModuleStatus.Initialized);
        });
    });
});
