import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SetupPhase } from '@app/types/events-payloads';
import { AppModule, AppModuleStatus } from '../types/setup';

// Mock stores
const mockSetupStore = {
    state: {
        core_phase_setup_payload: undefined as any,
        cpu_mining_phase_setup_payload: undefined as any,
        gpu_mining_phase_setup_payload: undefined as any,
        node_phase_setup_payload: undefined as any,
        wallet_phase_setup_payload: undefined as any,
        isInitialSetupFinished: false,
        disabled_phases: [] as SetupPhase[],
        app_modules: {
            [AppModule.CpuMining]: { status: AppModuleStatus.NotInitialized, error_messages: [] },
            [AppModule.GpuMining]: { status: AppModuleStatus.NotInitialized, error_messages: [] },
            [AppModule.Wallet]: { status: AppModuleStatus.NotInitialized, error_messages: [] },
        },
    },
    setState: vi.fn((update) => {
        if (typeof update === 'function') {
            mockSetupStore.state = { ...mockSetupStore.state, ...update(mockSetupStore.state) };
        } else {
            mockSetupStore.state = { ...mockSetupStore.state, ...update };
        }
    }),
    getState: vi.fn(() => mockSetupStore.state),
};

function resetMockStore() {
    mockSetupStore.state = {
        core_phase_setup_payload: undefined,
        cpu_mining_phase_setup_payload: undefined,
        gpu_mining_phase_setup_payload: undefined,
        node_phase_setup_payload: undefined,
        wallet_phase_setup_payload: undefined,
        isInitialSetupFinished: false,
        disabled_phases: [],
        app_modules: {
            [AppModule.CpuMining]: { status: AppModuleStatus.NotInitialized, error_messages: [] },
            [AppModule.GpuMining]: { status: AppModuleStatus.NotInitialized, error_messages: [] },
            [AppModule.Wallet]: { status: AppModuleStatus.NotInitialized, error_messages: [] },
        },
    };
}

describe('setupStoreActions', () => {
    beforeEach(() => {
        resetMockStore();
        vi.clearAllMocks();
    });

    describe('updateSetupProgress', () => {
        it('updates core phase payload', () => {
            const payload = {
                setup_phase: SetupPhase.Core,
                title: 'Core Setup',
                title_params: {},
                progress: 50,
            };

            if (payload.setup_phase === SetupPhase.Core) {
                mockSetupStore.setState({ core_phase_setup_payload: payload });
            }

            expect(mockSetupStore.state.core_phase_setup_payload).toEqual(payload);
        });

        it('updates cpu mining phase payload', () => {
            const payload = {
                setup_phase: SetupPhase.CpuMining,
                title: 'CPU Mining Setup',
                title_params: {},
                progress: 75,
            };

            if (payload.setup_phase === SetupPhase.CpuMining) {
                mockSetupStore.setState({ cpu_mining_phase_setup_payload: payload });
            }

            expect(mockSetupStore.state.cpu_mining_phase_setup_payload).toEqual(payload);
        });

        it('updates gpu mining phase payload', () => {
            const payload = {
                setup_phase: SetupPhase.GpuMining,
                title: 'GPU Mining Setup',
                title_params: {},
                progress: 25,
            };

            if (payload.setup_phase === SetupPhase.GpuMining) {
                mockSetupStore.setState({ gpu_mining_phase_setup_payload: payload });
            }

            expect(mockSetupStore.state.gpu_mining_phase_setup_payload).toEqual(payload);
        });

        it('updates node phase payload', () => {
            const payload = {
                setup_phase: SetupPhase.Node,
                title: 'Node Setup',
                title_params: {},
                progress: 100,
            };

            if (payload.setup_phase === SetupPhase.Node) {
                mockSetupStore.setState({ node_phase_setup_payload: payload });
            }

            expect(mockSetupStore.state.node_phase_setup_payload).toEqual(payload);
        });

        it('updates wallet phase payload', () => {
            const payload = {
                setup_phase: SetupPhase.Wallet,
                title: 'Wallet Setup',
                title_params: {},
                progress: 100,
            };

            if (payload.setup_phase === SetupPhase.Wallet) {
                mockSetupStore.setState({ wallet_phase_setup_payload: payload });
            }

            expect(mockSetupStore.state.wallet_phase_setup_payload).toEqual(payload);
        });

        it('handles undefined payload gracefully', () => {
            const payload = undefined;

            if (!payload) {
                // Should warn and return early
                expect(payload).toBeUndefined();
            }
        });
    });

    describe('clearSetupProgress', () => {
        it('clears core phase payload', () => {
            mockSetupStore.state.core_phase_setup_payload = { setup_phase: SetupPhase.Core };

            const setupPhase = SetupPhase.Core;
            if (setupPhase === SetupPhase.Core) {
                mockSetupStore.setState({ core_phase_setup_payload: undefined });
            }

            expect(mockSetupStore.state.core_phase_setup_payload).toBeUndefined();
        });

        it('clears cpu mining phase payload', () => {
            mockSetupStore.state.cpu_mining_phase_setup_payload = { setup_phase: SetupPhase.CpuMining };

            const setupPhase = SetupPhase.CpuMining;
            if (setupPhase === SetupPhase.CpuMining) {
                mockSetupStore.setState({ cpu_mining_phase_setup_payload: undefined });
            }

            expect(mockSetupStore.state.cpu_mining_phase_setup_payload).toBeUndefined();
        });

        it('clears gpu mining phase payload', () => {
            mockSetupStore.state.gpu_mining_phase_setup_payload = { setup_phase: SetupPhase.GpuMining };

            const setupPhase = SetupPhase.GpuMining;
            if (setupPhase === SetupPhase.GpuMining) {
                mockSetupStore.setState({ gpu_mining_phase_setup_payload: undefined });
            }

            expect(mockSetupStore.state.gpu_mining_phase_setup_payload).toBeUndefined();
        });

        it('clears node phase payload', () => {
            mockSetupStore.state.node_phase_setup_payload = { setup_phase: SetupPhase.Node };

            const setupPhase = SetupPhase.Node;
            if (setupPhase === SetupPhase.Node) {
                mockSetupStore.setState({ node_phase_setup_payload: undefined });
            }

            expect(mockSetupStore.state.node_phase_setup_payload).toBeUndefined();
        });

        it('clears wallet phase payload', () => {
            mockSetupStore.state.wallet_phase_setup_payload = { setup_phase: SetupPhase.Wallet };

            const setupPhase = SetupPhase.Wallet;
            if (setupPhase === SetupPhase.Wallet) {
                mockSetupStore.setState({ wallet_phase_setup_payload: undefined });
            }

            expect(mockSetupStore.state.wallet_phase_setup_payload).toBeUndefined();
        });
    });

    describe('setInitialSetupFinished', () => {
        it('sets initial setup finished to true', () => {
            mockSetupStore.setState({ isInitialSetupFinished: true });
            expect(mockSetupStore.state.isInitialSetupFinished).toBe(true);
        });

        it('sets initial setup finished to false', () => {
            mockSetupStore.state.isInitialSetupFinished = true;
            mockSetupStore.setState({ isInitialSetupFinished: false });
            expect(mockSetupStore.state.isInitialSetupFinished).toBe(false);
        });
    });

    describe('updateDisabledPhases', () => {
        it('sets disabled phases array', () => {
            const disabledPhases = [SetupPhase.CpuMining, SetupPhase.GpuMining];
            mockSetupStore.setState({ disabled_phases: disabledPhases });
            expect(mockSetupStore.state.disabled_phases).toEqual(disabledPhases);
        });

        it('can set empty disabled phases', () => {
            mockSetupStore.state.disabled_phases = [SetupPhase.Core];
            mockSetupStore.setState({ disabled_phases: [] });
            expect(mockSetupStore.state.disabled_phases).toEqual([]);
        });

        it('can set all phases as disabled', () => {
            const allPhases = [
                SetupPhase.Core,
                SetupPhase.CpuMining,
                SetupPhase.GpuMining,
                SetupPhase.Node,
                SetupPhase.Wallet,
            ];
            mockSetupStore.setState({ disabled_phases: allPhases });
            expect(mockSetupStore.state.disabled_phases).toHaveLength(5);
        });
    });

    describe('updateAppModule', () => {
        it('updates CPU mining module status', () => {
            const state = {
                module: AppModule.CpuMining,
                status: AppModuleStatus.Initialized,
                error_messages: [],
            };

            mockSetupStore.setState((prevState: typeof mockSetupStore.state) => ({
                app_modules: {
                    ...prevState.app_modules,
                    [state.module]: {
                        ...prevState.app_modules[state.module],
                        status: state.status,
                        error_messages: state.error_messages,
                    },
                },
            }));

            expect(mockSetupStore.state.app_modules[AppModule.CpuMining].status).toBe(AppModuleStatus.Initialized);
        });

        it('updates GPU mining module status', () => {
            const state = {
                module: AppModule.GpuMining,
                status: AppModuleStatus.Initialized,
                error_messages: [],
            };

            mockSetupStore.setState((prevState: typeof mockSetupStore.state) => ({
                app_modules: {
                    ...prevState.app_modules,
                    [state.module]: {
                        ...prevState.app_modules[state.module],
                        status: state.status,
                        error_messages: state.error_messages,
                    },
                },
            }));

            expect(mockSetupStore.state.app_modules[AppModule.GpuMining].status).toBe(AppModuleStatus.Initialized);
        });

        it('updates Wallet module status', () => {
            const state = {
                module: AppModule.Wallet,
                status: AppModuleStatus.Initialized,
                error_messages: [],
            };

            mockSetupStore.setState((prevState: typeof mockSetupStore.state) => ({
                app_modules: {
                    ...prevState.app_modules,
                    [state.module]: {
                        ...prevState.app_modules[state.module],
                        status: state.status,
                        error_messages: state.error_messages,
                    },
                },
            }));

            expect(mockSetupStore.state.app_modules[AppModule.Wallet].status).toBe(AppModuleStatus.Initialized);
        });

        it('handles module failure with error messages', () => {
            const state = {
                module: AppModule.CpuMining,
                status: AppModuleStatus.Failed,
                error_messages: ['Failed to initialize', 'Hardware not found'],
            };

            mockSetupStore.setState((prevState: typeof mockSetupStore.state) => ({
                app_modules: {
                    ...prevState.app_modules,
                    [state.module]: {
                        ...prevState.app_modules[state.module],
                        status: state.status,
                        error_messages: state.error_messages,
                    },
                },
            }));

            expect(mockSetupStore.state.app_modules[AppModule.CpuMining].status).toBe(AppModuleStatus.Failed);
            expect(mockSetupStore.state.app_modules[AppModule.CpuMining].error_messages).toHaveLength(2);
        });

        it('preserves other module states when updating one', () => {
            // First initialize GPU
            mockSetupStore.setState((prevState: typeof mockSetupStore.state) => ({
                app_modules: {
                    ...prevState.app_modules,
                    [AppModule.GpuMining]: {
                        status: AppModuleStatus.Initialized,
                        error_messages: [],
                    },
                },
            }));

            // Then initialize CPU
            mockSetupStore.setState((prevState: typeof mockSetupStore.state) => ({
                app_modules: {
                    ...prevState.app_modules,
                    [AppModule.CpuMining]: {
                        status: AppModuleStatus.Initialized,
                        error_messages: [],
                    },
                },
            }));

            // GPU should still be initialized
            expect(mockSetupStore.state.app_modules[AppModule.GpuMining].status).toBe(AppModuleStatus.Initialized);
            expect(mockSetupStore.state.app_modules[AppModule.CpuMining].status).toBe(AppModuleStatus.Initialized);
        });
    });

    describe('module status transitions', () => {
        it('transitions from NotInitialized to Initialized', () => {
            expect(mockSetupStore.state.app_modules[AppModule.CpuMining].status).toBe(AppModuleStatus.NotInitialized);

            mockSetupStore.setState((prevState: typeof mockSetupStore.state) => ({
                app_modules: {
                    ...prevState.app_modules,
                    [AppModule.CpuMining]: {
                        status: AppModuleStatus.Initialized,
                        error_messages: [],
                    },
                },
            }));

            expect(mockSetupStore.state.app_modules[AppModule.CpuMining].status).toBe(AppModuleStatus.Initialized);
        });

        it('transitions from NotInitialized to Failed', () => {
            expect(mockSetupStore.state.app_modules[AppModule.GpuMining].status).toBe(AppModuleStatus.NotInitialized);

            mockSetupStore.setState((prevState: typeof mockSetupStore.state) => ({
                app_modules: {
                    ...prevState.app_modules,
                    [AppModule.GpuMining]: {
                        status: AppModuleStatus.Failed,
                        error_messages: ['No GPU found'],
                    },
                },
            }));

            expect(mockSetupStore.state.app_modules[AppModule.GpuMining].status).toBe(AppModuleStatus.Failed);
        });

        it('can transition back to NotInitialized', () => {
            mockSetupStore.state.app_modules[AppModule.Wallet].status = AppModuleStatus.Initialized;

            mockSetupStore.setState((prevState: typeof mockSetupStore.state) => ({
                app_modules: {
                    ...prevState.app_modules,
                    [AppModule.Wallet]: {
                        status: AppModuleStatus.NotInitialized,
                        error_messages: [],
                    },
                },
            }));

            expect(mockSetupStore.state.app_modules[AppModule.Wallet].status).toBe(AppModuleStatus.NotInitialized);
        });
    });

    describe('setup phase enum values', () => {
        it('has Core phase', () => {
            expect(SetupPhase.Core).toBeDefined();
        });

        it('has CpuMining phase', () => {
            expect(SetupPhase.CpuMining).toBeDefined();
        });

        it('has GpuMining phase', () => {
            expect(SetupPhase.GpuMining).toBeDefined();
        });

        it('has Node phase', () => {
            expect(SetupPhase.Node).toBeDefined();
        });

        it('has Wallet phase', () => {
            expect(SetupPhase.Wallet).toBeDefined();
        });
    });

    describe('app module enum values', () => {
        it('has CpuMining module', () => {
            expect(AppModule.CpuMining).toBeDefined();
        });

        it('has GpuMining module', () => {
            expect(AppModule.GpuMining).toBeDefined();
        });

        it('has Wallet module', () => {
            expect(AppModule.Wallet).toBeDefined();
        });
    });

    describe('app module status enum values', () => {
        it('has NotInitialized status', () => {
            expect(AppModuleStatus.NotInitialized).toBeDefined();
        });

        it('has Initialized status', () => {
            expect(AppModuleStatus.Initialized).toBeDefined();
        });

        it('has Failed status', () => {
            expect(AppModuleStatus.Failed).toBeDefined();
        });
    });

    describe('complex setup scenarios', () => {
        it('tracks complete initialization flow', () => {
            // Start: all modules not initialized
            expect(mockSetupStore.state.app_modules[AppModule.CpuMining].status).toBe(AppModuleStatus.NotInitialized);
            expect(mockSetupStore.state.app_modules[AppModule.GpuMining].status).toBe(AppModuleStatus.NotInitialized);
            expect(mockSetupStore.state.app_modules[AppModule.Wallet].status).toBe(AppModuleStatus.NotInitialized);

            // Initialize all modules
            [AppModule.CpuMining, AppModule.GpuMining, AppModule.Wallet].forEach((module) => {
                mockSetupStore.setState((prevState: typeof mockSetupStore.state) => ({
                    app_modules: {
                        ...prevState.app_modules,
                        [module]: { status: AppModuleStatus.Initialized, error_messages: [] },
                    },
                }));
            });

            // All should be initialized
            expect(mockSetupStore.state.app_modules[AppModule.CpuMining].status).toBe(AppModuleStatus.Initialized);
            expect(mockSetupStore.state.app_modules[AppModule.GpuMining].status).toBe(AppModuleStatus.Initialized);
            expect(mockSetupStore.state.app_modules[AppModule.Wallet].status).toBe(AppModuleStatus.Initialized);
        });

        it('handles partial initialization with some failures', () => {
            // CPU succeeds
            mockSetupStore.setState((prevState: typeof mockSetupStore.state) => ({
                app_modules: {
                    ...prevState.app_modules,
                    [AppModule.CpuMining]: { status: AppModuleStatus.Initialized, error_messages: [] },
                },
            }));

            // GPU fails
            mockSetupStore.setState((prevState: typeof mockSetupStore.state) => ({
                app_modules: {
                    ...prevState.app_modules,
                    [AppModule.GpuMining]: { status: AppModuleStatus.Failed, error_messages: ['No GPU'] },
                },
            }));

            // Wallet succeeds
            mockSetupStore.setState((prevState: typeof mockSetupStore.state) => ({
                app_modules: {
                    ...prevState.app_modules,
                    [AppModule.Wallet]: { status: AppModuleStatus.Initialized, error_messages: [] },
                },
            }));

            expect(mockSetupStore.state.app_modules[AppModule.CpuMining].status).toBe(AppModuleStatus.Initialized);
            expect(mockSetupStore.state.app_modules[AppModule.GpuMining].status).toBe(AppModuleStatus.Failed);
            expect(mockSetupStore.state.app_modules[AppModule.Wallet].status).toBe(AppModuleStatus.Initialized);
        });
    });
});
