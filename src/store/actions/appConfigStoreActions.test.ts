/**
 * @vitest-environment jsdom
 */
/**
 * Tests for appConfigStoreActions patterns and logic.
 *
 * These tests validate the settings action patterns without requiring Tauri:
 * - Optimistic update patterns
 * - Rollback logic on errors
 * - State transformation logic
 * - Business rules for settings changes
 */
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import i18next, { changeLanguage } from 'i18next';
import { Language } from '@app/i18initializer.ts';
import { MiningModeType, PauseOnBatteryModeState } from '@app/types/configs';
import { setError } from './appStateStoreActions.ts';
import { setApplicationLanguage, setShouldAlwaysUseSystemLanguage } from './appConfigStoreActions.ts';
import { useConfigUIStore } from '../useAppConfigStore.ts';

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({
        listen: vi.fn(),
        onCloseRequested: vi.fn(),
    })),
}));

vi.mock('i18next', () => ({
    default: {
        language: 'en-US',
        t: (key: string) => key,
    },
    changeLanguage: vi.fn(),
}));

vi.mock('@app/i18initializer.ts', () => ({
    Language: {
        EN: 'en',
        FR: 'fr',
    },
    resolveI18nLanguage: vi.fn((languageCode: string) => {
        if (languageCode.startsWith('en')) {
            return 'en';
        }

        if (languageCode.startsWith('fr')) {
            return 'fr';
        }

        return 'en';
    }),
}));

vi.mock('./appStateStoreActions.ts', () => ({
    setError: vi.fn(),
}));

vi.mock('./miningStoreActions', () => ({
    restartMining: vi.fn(),
    setLastSelectedMiningModeNameForSchedulerEvent: vi.fn(),
    startCpuMining: vi.fn(),
    startGpuMining: vi.fn(),
    stopCpuMining: vi.fn(),
    stopGpuMining: vi.fn(),
}));

vi.mock('./uiStoreActions', () => ({
    loadAnimation: vi.fn(),
    setUITheme: vi.fn(),
    updateSetMiningModeAsSchedulerEventMode: vi.fn(),
}));

vi.mock('../useExchangeStore.ts', () => ({
    setCurrentExchangeMinerId: vi.fn(),
}));

vi.mock('@app/hooks/exchanges/fetchExchangeContent.ts', () => ({
    refreshXCContent: vi.fn(),
}));

vi.mock('../selectors/appConfigStoreSelectors.ts', () => ({
    getSelectedCpuPool: vi.fn(),
    getSelectedGpuPool: vi.fn(),
}));

vi.mock('@app/store/stores/userFeedbackStore.ts', () => ({
    setFeedbackConfigItems: vi.fn(),
}));

describe('appConfigStoreActions', () => {
    describe('optimistic update pattern', () => {
        it('updates state immediately before async operation', () => {
            let state = { cpu_mining_enabled: true };
            const enabled = false;

            // Simulate optimistic update
            state = { ...state, cpu_mining_enabled: enabled };

            expect(state.cpu_mining_enabled).toBe(false);
        });

        it('rolls back state on error', () => {
            let state = { cpu_mining_enabled: true };
            const enabled = false;

            // Simulate optimistic update
            state = { ...state, cpu_mining_enabled: enabled };
            expect(state.cpu_mining_enabled).toBe(false);

            // Simulate rollback on error
            state = { ...state, cpu_mining_enabled: !enabled };
            expect(state.cpu_mining_enabled).toBe(true);
        });
    });

    describe('setCpuMiningEnabled logic', () => {
        interface TestState {
            cpu_mining_enabled: boolean;
            isCpuMiningInitiated: boolean;
            isGpuMiningInitiated: boolean;
            cpuMining: boolean;
        }

        const shouldStopCpuMining = (state: TestState): boolean => {
            return state.cpuMining || state.isCpuMiningInitiated;
        };

        const shouldStartCpuMiningAfterEnable = (state: TestState, enabled: boolean): boolean => {
            const anyMiningInitiated = state.isCpuMiningInitiated || state.isGpuMiningInitiated;
            return anyMiningInitiated && enabled;
        };

        it('should stop CPU mining when disabling if currently mining', () => {
            const state: TestState = {
                cpu_mining_enabled: true,
                isCpuMiningInitiated: true,
                isGpuMiningInitiated: false,
                cpuMining: true,
            };
            expect(shouldStopCpuMining(state)).toBe(true);
        });

        it('should stop CPU mining when disabling if initiated but not mining', () => {
            const state: TestState = {
                cpu_mining_enabled: true,
                isCpuMiningInitiated: true,
                isGpuMiningInitiated: false,
                cpuMining: false,
            };
            expect(shouldStopCpuMining(state)).toBe(true);
        });

        it('should not stop CPU mining if not initiated and not mining', () => {
            const state: TestState = {
                cpu_mining_enabled: true,
                isCpuMiningInitiated: false,
                isGpuMiningInitiated: false,
                cpuMining: false,
            };
            expect(shouldStopCpuMining(state)).toBe(false);
        });

        it('should start CPU mining after enable if any mining was initiated', () => {
            const state: TestState = {
                cpu_mining_enabled: false,
                isCpuMiningInitiated: false,
                isGpuMiningInitiated: true,
                cpuMining: false,
            };
            expect(shouldStartCpuMiningAfterEnable(state, true)).toBe(true);
        });

        it('should not start CPU mining after enable if no mining was initiated', () => {
            const state: TestState = {
                cpu_mining_enabled: false,
                isCpuMiningInitiated: false,
                isGpuMiningInitiated: false,
                cpuMining: false,
            };
            expect(shouldStartCpuMiningAfterEnable(state, true)).toBe(false);
        });

        it('should not start CPU mining when disabling', () => {
            const state: TestState = {
                cpu_mining_enabled: true,
                isCpuMiningInitiated: true,
                isGpuMiningInitiated: true,
                cpuMining: true,
            };
            expect(shouldStartCpuMiningAfterEnable(state, false)).toBe(false);
        });
    });

    describe('setGpuMiningEnabled logic', () => {
        interface GpuDeviceSettings {
            device_id: number;
            is_excluded: boolean;
        }

        const shouldEnableAllDevicesAfterGpuEnable = (devices: GpuDeviceSettings[], enabled: boolean): boolean => {
            return enabled && devices.every((device) => device.is_excluded);
        };

        const shouldExcludeAllDevicesAfterGpuDisable = (devices: GpuDeviceSettings[], enabled: boolean): boolean => {
            return !enabled && devices.some((device) => !device.is_excluded);
        };

        it('should enable all devices when GPU mining enabled and all were excluded', () => {
            const devices: GpuDeviceSettings[] = [
                { device_id: 0, is_excluded: true },
                { device_id: 1, is_excluded: true },
            ];
            expect(shouldEnableAllDevicesAfterGpuEnable(devices, true)).toBe(true);
        });

        it('should not enable all devices when some were already enabled', () => {
            const devices: GpuDeviceSettings[] = [
                { device_id: 0, is_excluded: true },
                { device_id: 1, is_excluded: false },
            ];
            expect(shouldEnableAllDevicesAfterGpuEnable(devices, true)).toBe(false);
        });

        it('should exclude all devices when GPU mining disabled', () => {
            const devices: GpuDeviceSettings[] = [
                { device_id: 0, is_excluded: false },
                { device_id: 1, is_excluded: true },
            ];
            expect(shouldExcludeAllDevicesAfterGpuDisable(devices, false)).toBe(true);
        });

        it('should not exclude devices when GPU mining enabled', () => {
            const devices: GpuDeviceSettings[] = [{ device_id: 0, is_excluded: false }];
            expect(shouldExcludeAllDevicesAfterGpuDisable(devices, true)).toBe(false);
        });
    });

    describe('selectMiningMode logic', () => {
        interface ModeChangeState {
            shouldSetMiningModeAsSchedulerEventMode: boolean;
            cpuMining: boolean;
            gpuMining: boolean;
            wasCpuMiningInitiated: boolean;
            wasGpuMiningInitiated: boolean;
        }

        const shouldSkipModeChange = (state: ModeChangeState): boolean => {
            return state.shouldSetMiningModeAsSchedulerEventMode;
        };

        const shouldStopCpuBeforeModeChange = (state: ModeChangeState): boolean => {
            return state.cpuMining;
        };

        const shouldStopGpuBeforeModeChange = (state: ModeChangeState): boolean => {
            return state.gpuMining || state.wasGpuMiningInitiated;
        };

        const shouldRestartCpuAfterModeChange = (state: ModeChangeState): boolean => {
            return state.wasCpuMiningInitiated;
        };

        const shouldRestartGpuAfterModeChange = (state: ModeChangeState): boolean => {
            return state.wasGpuMiningInitiated;
        };

        it('should skip mode change when setting for scheduler event', () => {
            const state: ModeChangeState = {
                shouldSetMiningModeAsSchedulerEventMode: true,
                cpuMining: false,
                gpuMining: false,
                wasCpuMiningInitiated: false,
                wasGpuMiningInitiated: false,
            };
            expect(shouldSkipModeChange(state)).toBe(true);
        });

        it('should not skip mode change in normal operation', () => {
            const state: ModeChangeState = {
                shouldSetMiningModeAsSchedulerEventMode: false,
                cpuMining: true,
                gpuMining: true,
                wasCpuMiningInitiated: true,
                wasGpuMiningInitiated: true,
            };
            expect(shouldSkipModeChange(state)).toBe(false);
        });

        it('should stop CPU before mode change if currently mining', () => {
            const state: ModeChangeState = {
                shouldSetMiningModeAsSchedulerEventMode: false,
                cpuMining: true,
                gpuMining: false,
                wasCpuMiningInitiated: true,
                wasGpuMiningInitiated: false,
            };
            expect(shouldStopCpuBeforeModeChange(state)).toBe(true);
        });

        it('should stop GPU before mode change if currently mining or was initiated', () => {
            const state: ModeChangeState = {
                shouldSetMiningModeAsSchedulerEventMode: false,
                cpuMining: false,
                gpuMining: false,
                wasCpuMiningInitiated: false,
                wasGpuMiningInitiated: true,
            };
            expect(shouldStopGpuBeforeModeChange(state)).toBe(true);
        });

        it('should restart CPU after mode change if was initiated', () => {
            const state: ModeChangeState = {
                shouldSetMiningModeAsSchedulerEventMode: false,
                cpuMining: false,
                gpuMining: false,
                wasCpuMiningInitiated: true,
                wasGpuMiningInitiated: false,
            };
            expect(shouldRestartCpuAfterModeChange(state)).toBe(true);
        });

        it('should restart GPU after mode change if was initiated', () => {
            const state: ModeChangeState = {
                shouldSetMiningModeAsSchedulerEventMode: false,
                cpuMining: false,
                gpuMining: false,
                wasCpuMiningInitiated: false,
                wasGpuMiningInitiated: true,
            };
            expect(shouldRestartGpuAfterModeChange(state)).toBe(true);
        });
    });

    describe('updateCustomMiningMode state transformation', () => {
        it('correctly updates Custom mode in mining_modes', () => {
            const currentState = {
                mining_modes: {
                    Eco: { mode_type: MiningModeType.Eco, cpu_usage_percentage: 25, gpu_usage_percentage: 25 },
                    Custom: { mode_type: MiningModeType.Custom, cpu_usage_percentage: 50, gpu_usage_percentage: 50 },
                },
            };

            const customCpuUsage = 75;
            const customGpuUsage = 80;

            const newState = {
                ...currentState,
                mining_modes: {
                    ...currentState.mining_modes,
                    Custom: {
                        ...currentState.mining_modes.Custom,
                        cpu_usage_percentage: customCpuUsage,
                        gpu_usage_percentage: customGpuUsage,
                    },
                },
            };

            expect(newState.mining_modes.Custom.cpu_usage_percentage).toBe(75);
            expect(newState.mining_modes.Custom.gpu_usage_percentage).toBe(80);
            expect(newState.mining_modes.Eco.cpu_usage_percentage).toBe(25);
        });
    });

    describe('toggleDeviceExclusion logic', () => {
        interface DeviceState {
            devices: Record<number, { device_id: number; is_excluded: boolean }>;
        }

        const updateDeviceExclusion = (state: DeviceState, deviceIndex: number, excluded: boolean): DeviceState => {
            return {
                ...state,
                devices: {
                    ...state.devices,
                    [deviceIndex]: { ...state.devices[deviceIndex], is_excluded: excluded },
                },
            };
        };

        const areAllDevicesExcluded = (devices: Record<number, { is_excluded: boolean }>): boolean => {
            return Object.values(devices).every((device) => device.is_excluded);
        };

        it('updates device exclusion state correctly', () => {
            const state: DeviceState = {
                devices: {
                    0: { device_id: 0, is_excluded: false },
                    1: { device_id: 1, is_excluded: false },
                },
            };

            const newState = updateDeviceExclusion(state, 0, true);
            expect(newState.devices[0].is_excluded).toBe(true);
            expect(newState.devices[1].is_excluded).toBe(false);
        });

        it('detects when all devices are excluded', () => {
            const devices = {
                0: { is_excluded: true },
                1: { is_excluded: true },
            };
            expect(areAllDevicesExcluded(devices)).toBe(true);
        });

        it('detects when not all devices are excluded', () => {
            const devices = {
                0: { is_excluded: true },
                1: { is_excluded: false },
            };
            expect(areAllDevicesExcluded(devices)).toBe(false);
        });

        it('should disable GPU mining when all devices become excluded', () => {
            const state: DeviceState = {
                devices: {
                    0: { device_id: 0, is_excluded: true },
                    1: { device_id: 1, is_excluded: false },
                },
            };

            const newState = updateDeviceExclusion(state, 1, true);
            const shouldDisableGpuMining = areAllDevicesExcluded(newState.devices);
            expect(shouldDisableGpuMining).toBe(true);
        });
    });

    describe('setPauseOnBatteryMode logic', () => {
        it('correctly stores previous mode for rollback', () => {
            const currentMode = PauseOnBatteryModeState.Enabled;
            const newMode = PauseOnBatteryModeState.Disabled;

            expect(currentMode).not.toBe(newMode);

            // On error, would rollback to previous
            const rollbackMode = currentMode;
            expect(rollbackMode).toBe(PauseOnBatteryModeState.Enabled);
        });

        it('handles NotSupported state', () => {
            const mode = PauseOnBatteryModeState.NotSupported;
            expect(mode).toBe('NotSupported');
        });
    });

    describe('language settings actions', () => {
        const invokeMock = invoke as unknown as ReturnType<typeof vi.fn>;
        const changeLanguageMock = changeLanguage as unknown as ReturnType<typeof vi.fn>;
        const setErrorMock = setError as unknown as ReturnType<typeof vi.fn>;

        beforeEach(() => {
            vi.clearAllMocks();
            i18next.language = 'en-US';
            useConfigUIStore.setState((state) => ({
                ...state,
                application_language: 'en-US',
                should_always_use_system_language: true,
            }));
        });

        it('skips manual language update when resolved system language already matches selected language', async () => {
            await setApplicationLanguage(Language.EN);

            expect(invokeMock).not.toHaveBeenCalled();
            expect(changeLanguageMock).not.toHaveBeenCalled();
            expect(useConfigUIStore.getState().should_always_use_system_language).toBe(true);
        });

        it('switches to manual mode when selected language differs from system language', async () => {
            invokeMock.mockResolvedValue(undefined);

            await setApplicationLanguage(Language.FR);

            expect(invokeMock).toHaveBeenCalledWith('set_application_language', { applicationLanguage: Language.FR });
            expect(invokeMock).toHaveBeenCalledWith('set_should_always_use_system_language', {
                shouldAlwaysUseSystemLanguage: false,
            });
            expect(changeLanguageMock).toHaveBeenCalledWith(Language.FR);
            expect(useConfigUIStore.getState().should_always_use_system_language).toBe(false);
            expect(useConfigUIStore.getState().application_language).toBe(Language.FR);
        });

        it('rolls back frontend state and compensates backend on partial failure', async () => {
            invokeMock.mockImplementation((command: string, payload?: { applicationLanguage?: string }) => {
                if (command === 'set_application_language' && payload?.applicationLanguage === Language.FR) {
                    return Promise.resolve(undefined);
                }

                if (command === 'set_should_always_use_system_language') {
                    return Promise.reject(new Error('toggle failed'));
                }

                if (command === 'set_application_language' && payload?.applicationLanguage === 'en-US') {
                    return Promise.resolve(undefined);
                }

                return Promise.resolve(undefined);
            });

            await setApplicationLanguage(Language.FR);

            expect(invokeMock).toHaveBeenCalledWith('set_application_language', { applicationLanguage: 'en-US' });
            expect(useConfigUIStore.getState().application_language).toBe('en-US');
            expect(useConfigUIStore.getState().should_always_use_system_language).toBe(true);
            expect(changeLanguageMock).toHaveBeenCalledWith('en-US');
            expect(setErrorMock).toHaveBeenCalledWith('Could not change application language');
        });

        it('keeps system language toggle enabled when language readback fails', async () => {
            useConfigUIStore.setState((state) => ({
                ...state,
                application_language: 'en',
                should_always_use_system_language: false,
            }));

            invokeMock.mockImplementation((command: string) => {
                if (command === 'set_should_always_use_system_language') {
                    return Promise.resolve(undefined);
                }

                if (command === 'get_application_language') {
                    return Promise.reject(new Error('readback failed'));
                }

                return Promise.resolve(undefined);
            });

            await setShouldAlwaysUseSystemLanguage(true);

            expect(useConfigUIStore.getState().should_always_use_system_language).toBe(true);
            expect(useConfigUIStore.getState().application_language).toBe('en');
            expect(changeLanguageMock).not.toHaveBeenCalled();
            expect(setErrorMock).toHaveBeenCalledWith('Could not resolve system language');
        });
    });

    describe('handleFeedbackFields state transformation', () => {
        it('creates correct feedback structure', () => {
            const feedbackType = 'long_time_miner' as const;
            const feedback_sent = true;
            const now = Date.now();

            const updated = {
                [feedbackType]: {
                    feedback_sent,
                    last_dismissed: {
                        secs_since_epoch: now / 1000,
                    },
                },
            };

            expect(updated.long_time_miner.feedback_sent).toBe(true);
            expect(updated.long_time_miner.last_dismissed.secs_since_epoch).toBeGreaterThan(0);
        });

        it('merges with existing feedback state', () => {
            const current = {
                early_close: {
                    feedback_sent: false,
                    last_dismissed: null,
                },
            };

            const updated = {
                long_time_miner: {
                    feedback_sent: true,
                    last_dismissed: { secs_since_epoch: 1234567890 },
                },
            };

            const merged = { ...current, ...updated };

            expect(merged.early_close).toBeDefined();
            expect(merged.long_time_miner).toBeDefined();
        });
    });

    describe('pool change logic', () => {
        interface PoolChangeState {
            isCpuMiningEnabled: boolean;
            anyMiningInitiated: boolean;
            isCpuMiningInitiated: boolean;
            cpuMining: boolean;
        }

        const shouldStopBeforePoolChange = (state: PoolChangeState): boolean => {
            return state.cpuMining || state.isCpuMiningInitiated;
        };

        const shouldRestartAfterPoolChange = (state: PoolChangeState): boolean => {
            return state.anyMiningInitiated && state.isCpuMiningEnabled;
        };

        it('should stop mining before pool change if currently mining', () => {
            const state: PoolChangeState = {
                isCpuMiningEnabled: true,
                anyMiningInitiated: true,
                isCpuMiningInitiated: true,
                cpuMining: true,
            };
            expect(shouldStopBeforePoolChange(state)).toBe(true);
        });

        it('should restart after pool change if mining was initiated and enabled', () => {
            const state: PoolChangeState = {
                isCpuMiningEnabled: true,
                anyMiningInitiated: true,
                isCpuMiningInitiated: true,
                cpuMining: false,
            };
            expect(shouldRestartAfterPoolChange(state)).toBe(true);
        });

        it('should not restart if mining is disabled', () => {
            const state: PoolChangeState = {
                isCpuMiningEnabled: false,
                anyMiningInitiated: true,
                isCpuMiningInitiated: true,
                cpuMining: false,
            };
            expect(shouldRestartAfterPoolChange(state)).toBe(false);
        });
    });
});
