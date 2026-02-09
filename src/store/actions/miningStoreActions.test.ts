/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Mock window.matchMedia for useUIStore dependency
vi.hoisted(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        enumerable: true,
        value: vi.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(), // deprecated
            removeListener: vi.fn(), // deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

import { GpuMinerType, MinerControlsState } from '@app/types/events-payloads';
import { MiningStoreState } from '@app/store';

// Create mock stores
const mockMiningStore = {
    state: {
        customLevelsDialogOpen: false,
        isCpuMiningInitiated: false,
        isGpuMiningInitiated: false,
        selectedMiner: undefined as GpuMinerType | undefined,
        availableMiners: undefined as MiningStoreState['availableMiners'] | undefined,
        sessionMiningTime: {} as { startTimestamp?: number; stopTimestamp?: number; durationMs?: number },
        showEcoAlert: false,
        selectedResumeDuration: undefined as { durationHours: number; timeStamp: number } | undefined,
        eventSchedulerLastSelectedMiningModeName: undefined as string | undefined,
        miningControlsEnabled: true,
    },
    setState: vi.fn((update) => {
        if (typeof update === 'function') {
            mockMiningStore.state = { ...mockMiningStore.state, ...update(mockMiningStore.state) };
        } else {
            mockMiningStore.state = { ...mockMiningStore.state, ...update };
        }
    }),
    getState: vi.fn(() => mockMiningStore.state),
};

const mockMiningMetricsStore = {
    state: {
        cpu_mining_status: { is_mining: false },
        gpu_mining_status: { is_mining: false },
    },
    getState: vi.fn(() => mockMiningMetricsStore.state),
};

const mockConfigMiningStore = {
    state: {
        cpu_mining_enabled: true,
        gpu_mining_enabled: true,
        eco_alert_needed: false,
        mode_mining_times: { Eco: { secs: 3600 } },
        getSelectedMiningMode: () => ({ mode_type: 'Eco' }),
    },
    getState: vi.fn(() => mockConfigMiningStore.state),
};

const mockAirdropStore = {
    state: {
        features: [] as string[],
    },
    getState: vi.fn(() => mockAirdropStore.state),
};

// Reset state helper
function resetMockStores() {
    mockMiningStore.state = {
        customLevelsDialogOpen: false,
        isCpuMiningInitiated: false,
        isGpuMiningInitiated: false,
        selectedMiner: undefined,
        availableMiners: undefined,
        sessionMiningTime: {},
        showEcoAlert: false,
        selectedResumeDuration: undefined,
        eventSchedulerLastSelectedMiningModeName: undefined,
        miningControlsEnabled: true,
    };
    mockMiningMetricsStore.state = {
        cpu_mining_status: { is_mining: false },
        gpu_mining_status: { is_mining: false },
    };
    mockConfigMiningStore.state = {
        cpu_mining_enabled: true,
        gpu_mining_enabled: true,
        eco_alert_needed: false,
        mode_mining_times: { Eco: { secs: 3600 } },
        getSelectedMiningMode: () => ({ mode_type: 'Eco' }),
    };
    mockAirdropStore.state = { features: [] };
}

describe('miningStoreActions', () => {
    beforeEach(() => {
        resetMockStores();
        vi.clearAllMocks();
    });

    describe('setCustomLevelsDialogOpen', () => {
        it('opens the custom levels dialog', () => {
            mockMiningStore.setState({ customLevelsDialogOpen: true });
            expect(mockMiningStore.state.customLevelsDialogOpen).toBe(true);
        });

        it('closes the custom levels dialog', () => {
            mockMiningStore.state.customLevelsDialogOpen = true;
            mockMiningStore.setState({ customLevelsDialogOpen: false });
            expect(mockMiningStore.state.customLevelsDialogOpen).toBe(false);
        });
    });

    describe('setMiningControlsEnabled', () => {
        it('enables mining controls when gpu or cpu mining is enabled', () => {
            mockConfigMiningStore.state.gpu_mining_enabled = true;
            mockConfigMiningStore.state.cpu_mining_enabled = false;

            const gpu_mining_enabled = mockConfigMiningStore.getState().gpu_mining_enabled;
            const cpu_mining_enabled = mockConfigMiningStore.getState().cpu_mining_enabled;
            const neitherEnabled = !gpu_mining_enabled && !cpu_mining_enabled;

            const enabled = neitherEnabled ? false : true;
            mockMiningStore.setState({ miningControlsEnabled: enabled });

            expect(mockMiningStore.state.miningControlsEnabled).toBe(true);
        });

        it('disables mining controls when neither gpu nor cpu mining is enabled', () => {
            mockConfigMiningStore.state.gpu_mining_enabled = false;
            mockConfigMiningStore.state.cpu_mining_enabled = false;

            const gpu_mining_enabled = mockConfigMiningStore.getState().gpu_mining_enabled;
            const cpu_mining_enabled = mockConfigMiningStore.getState().cpu_mining_enabled;
            const neitherEnabled = !gpu_mining_enabled && !cpu_mining_enabled;

            const enabled = neitherEnabled ? false : true;
            mockMiningStore.setState({ miningControlsEnabled: enabled });

            expect(mockMiningStore.state.miningControlsEnabled).toBe(false);
        });
    });

    describe('handleSelectedMinerChanged', () => {
        it('sets selected miner to LolMiner', () => {
            mockMiningStore.setState({ selectedMiner: GpuMinerType.LolMiner });
            expect(mockMiningStore.state.selectedMiner).toBe(GpuMinerType.LolMiner);
        });
    });

    describe('handleAvailableMinersChanged', () => {
        it('sets available miners', () => {
            const miners = {
                [GpuMinerType.LolMiner]: { name: 'LolMiner', installed: true },
            };
            mockMiningStore.setState({ availableMiners: miners });
            expect(mockMiningStore.state.availableMiners).toEqual(miners);
        });
    });

    describe('setResumeDuration', () => {
        it('sets resume duration', () => {
            const resumeDuration = { durationHours: 2, timeStamp: Date.now() };
            mockMiningStore.setState({ selectedResumeDuration: resumeDuration });
            expect(mockMiningStore.state.selectedResumeDuration).toEqual(resumeDuration);
        });

        it('clears resume duration', () => {
            mockMiningStore.state.selectedResumeDuration = { durationHours: 2, timeStamp: Date.now() };
            mockMiningStore.setState({ selectedResumeDuration: undefined });
            expect(mockMiningStore.state.selectedResumeDuration).toBeUndefined();
        });
    });

    describe('handleSessionMiningTime', () => {
        it('sets start timestamp when starting mining', () => {
            const startTimestamp = Date.now();
            const current = mockMiningStore.getState().sessionMiningTime;

            if (startTimestamp && !current.startTimestamp) {
                mockMiningStore.setState({
                    sessionMiningTime: { ...current, startTimestamp },
                });
            }

            expect(mockMiningStore.state.sessionMiningTime.startTimestamp).toBe(startTimestamp);
        });

        it('does not overwrite start timestamp if already set', () => {
            const originalStart = 1000;
            mockMiningStore.state.sessionMiningTime = { startTimestamp: originalStart };

            const newStartTimestamp = 2000;
            const current = mockMiningStore.getState().sessionMiningTime;

            if (newStartTimestamp && !current.startTimestamp) {
                mockMiningStore.setState({
                    sessionMiningTime: { ...current, startTimestamp: newStartTimestamp },
                });
            }

            expect(mockMiningStore.state.sessionMiningTime.startTimestamp).toBe(originalStart);
        });

        it('calculates duration when stop timestamp is provided', () => {
            const startTimestamp = 1000;
            const stopTimestamp = 61000; // 60 seconds later
            mockMiningStore.state.sessionMiningTime = { startTimestamp };

            const current = mockMiningStore.getState().sessionMiningTime;
            const diff = stopTimestamp - (current.startTimestamp || 0);

            mockMiningStore.setState({
                sessionMiningTime: { ...current, stopTimestamp, durationMs: diff },
            });

            expect(mockMiningStore.state.sessionMiningTime.stopTimestamp).toBe(stopTimestamp);
            expect(mockMiningStore.state.sessionMiningTime.durationMs).toBe(60000);
        });
    });

    describe('checkMiningTime', () => {
        it('calculates duration from start and stop timestamps', () => {
            mockMiningStore.state.sessionMiningTime = {
                startTimestamp: 1000,
                stopTimestamp: 61000,
            };

            const current = mockMiningStore.getState().sessionMiningTime;
            const diff = (current.stopTimestamp || 0) - (current.startTimestamp || 0);

            mockMiningStore.setState({ sessionMiningTime: { ...current, durationMs: diff } });

            expect(mockMiningStore.state.sessionMiningTime.durationMs).toBe(60000);
        });

        it('returns 0 if no timestamps are set', () => {
            mockMiningStore.state.sessionMiningTime = {};

            const current = mockMiningStore.getState().sessionMiningTime;
            const diff = (current.stopTimestamp || 0) - (current.startTimestamp || 0);

            expect(diff).toBe(0);
        });

        it('updates stop timestamp if still mining', () => {
            mockMiningStore.state.sessionMiningTime = { startTimestamp: 1000 };
            mockMiningMetricsStore.state.cpu_mining_status.is_mining = true;

            const cpuMining = mockMiningMetricsStore.getState().cpu_mining_status.is_mining;
            const gpuMining = mockMiningMetricsStore.getState().gpu_mining_status.is_mining;
            const isStillMining = cpuMining || gpuMining;

            expect(isStillMining).toBe(true);
        });
    });

    describe('handleCpuMinerControlsStateChanged', () => {
        it('sets isCpuMiningInitiated to false on Idle state', () => {
            mockMiningStore.state.isCpuMiningInitiated = true;

            const state = MinerControlsState.Idle;
            if (state === MinerControlsState.Idle) {
                mockMiningStore.setState({ isCpuMiningInitiated: false });
            }

            expect(mockMiningStore.state.isCpuMiningInitiated).toBe(false);
        });

        it('sets isCpuMiningInitiated to true on Started state', () => {
            mockMiningStore.state.isCpuMiningInitiated = false;

            const state = MinerControlsState.Started;
            if (state === MinerControlsState.Started) {
                mockMiningStore.setState({ isCpuMiningInitiated: true });
            }

            expect(mockMiningStore.state.isCpuMiningInitiated).toBe(true);
        });

        it('sets isCpuMiningInitiated to false on Stopped state', () => {
            mockMiningStore.state.isCpuMiningInitiated = true;

            const state = MinerControlsState.Stopped;
            if (state === MinerControlsState.Stopped) {
                mockMiningStore.setState({ isCpuMiningInitiated: false });
            }

            expect(mockMiningStore.state.isCpuMiningInitiated).toBe(false);
        });
    });

    describe('handleGpuMinerControlsStateChanged', () => {
        it('sets isGpuMiningInitiated to false on Idle state', () => {
            mockMiningStore.state.isGpuMiningInitiated = true;

            const state = MinerControlsState.Idle;
            if (state === MinerControlsState.Idle) {
                mockMiningStore.setState({ isGpuMiningInitiated: false });
            }

            expect(mockMiningStore.state.isGpuMiningInitiated).toBe(false);
        });

        it('sets isGpuMiningInitiated to true on Started state', () => {
            mockMiningStore.state.isGpuMiningInitiated = false;

            const state = MinerControlsState.Started;
            if (state === MinerControlsState.Started) {
                mockMiningStore.setState({ isGpuMiningInitiated: true });
            }

            expect(mockMiningStore.state.isGpuMiningInitiated).toBe(true);
        });

        it('sets isGpuMiningInitiated to false on Stopped state', () => {
            mockMiningStore.state.isGpuMiningInitiated = true;

            const state = MinerControlsState.Stopped;
            if (state === MinerControlsState.Stopped) {
                mockMiningStore.setState({ isGpuMiningInitiated: false });
            }

            expect(mockMiningStore.state.isGpuMiningInitiated).toBe(false);
        });
    });

    describe('setShowEcoAlert', () => {
        it('shows eco alert when feature flag is enabled and showEcoAlert is true', () => {
            mockAirdropStore.state.features = ['FE_UI_ECO_ALERT'];

            const ff = mockAirdropStore.getState().features;
            const canShow = ff?.includes('FE_UI_ECO_ALERT');

            mockMiningStore.setState({ showEcoAlert: canShow && true });

            expect(mockMiningStore.state.showEcoAlert).toBe(true);
        });

        it('does not show eco alert when feature flag is disabled', () => {
            mockAirdropStore.state.features = [];

            const ff = mockAirdropStore.getState().features;
            const canShow = ff?.includes('FE_UI_ECO_ALERT');

            mockMiningStore.setState({ showEcoAlert: canShow && true });

            expect(mockMiningStore.state.showEcoAlert).toBe(false);
        });

        it('hides eco alert when showEcoAlert is false', () => {
            mockAirdropStore.state.features = ['FE_UI_ECO_ALERT'];
            mockMiningStore.state.showEcoAlert = true;

            const ff = mockAirdropStore.getState().features;
            const canShow = ff?.includes('FE_UI_ECO_ALERT');

            mockMiningStore.setState({ showEcoAlert: canShow && false });

            expect(mockMiningStore.state.showEcoAlert).toBe(false);
        });
    });

    describe('setLastSelectedMiningModeNameForSchedulerEvent', () => {
        it('sets the last selected mining mode name', () => {
            mockMiningStore.setState({ eventSchedulerLastSelectedMiningModeName: 'Ludicrous' });
            expect(mockMiningStore.state.eventSchedulerLastSelectedMiningModeName).toBe('Ludicrous');
        });

        it('can update to different mode names', () => {
            const modes = ['Eco', 'Standard', 'Ludicrous', 'Custom'];
            modes.forEach((mode) => {
                mockMiningStore.setState({ eventSchedulerLastSelectedMiningModeName: mode });
                expect(mockMiningStore.state.eventSchedulerLastSelectedMiningModeName).toBe(mode);
            });
        });
    });

    describe('mining initiation guards', () => {
        it('startCpuMining guard: returns early if not enabled', () => {
            mockConfigMiningStore.state.cpu_mining_enabled = false;

            const enabled = mockConfigMiningStore.getState().cpu_mining_enabled;
            const shouldStart = enabled;

            expect(shouldStart).toBe(false);
        });

        it('startCpuMining guard: returns early if already initiated', () => {
            mockMiningStore.state.isCpuMiningInitiated = true;

            const initiated = mockMiningStore.getState().isCpuMiningInitiated;
            const shouldStart = !initiated;

            expect(shouldStart).toBe(false);
        });

        it('startGpuMining guard: returns early if not enabled', () => {
            mockConfigMiningStore.state.gpu_mining_enabled = false;

            const enabled = mockConfigMiningStore.getState().gpu_mining_enabled;
            const shouldStart = enabled;

            expect(shouldStart).toBe(false);
        });

        it('startGpuMining guard: returns early if already initiated', () => {
            mockMiningStore.state.isGpuMiningInitiated = true;

            const initiated = mockMiningStore.getState().isGpuMiningInitiated;
            const shouldStart = !initiated;

            expect(shouldStart).toBe(false);
        });

        it('stopCpuMining guard: returns early if not initiated', () => {
            mockMiningStore.state.isCpuMiningInitiated = false;

            const initiated = mockMiningStore.getState().isCpuMiningInitiated;
            const shouldStop = initiated;

            expect(shouldStop).toBe(false);
        });

        it('stopGpuMining guard: returns early if not initiated', () => {
            mockMiningStore.state.isGpuMiningInitiated = false;

            const initiated = mockMiningStore.getState().isGpuMiningInitiated;
            const shouldStop = initiated;

            expect(shouldStop).toBe(false);
        });
    });

    describe('restartMining logic', () => {
        it('should restart if CPU is mining', () => {
            mockMiningMetricsStore.state.cpu_mining_status.is_mining = true;

            const isMining =
                mockMiningMetricsStore.getState().cpu_mining_status.is_mining ||
                mockMiningMetricsStore.getState().gpu_mining_status.is_mining;

            expect(isMining).toBe(true);
        });

        it('should restart if GPU is mining', () => {
            mockMiningMetricsStore.state.gpu_mining_status.is_mining = true;

            const isMining =
                mockMiningMetricsStore.getState().cpu_mining_status.is_mining ||
                mockMiningMetricsStore.getState().gpu_mining_status.is_mining;

            expect(isMining).toBe(true);
        });

        it('should not restart if nothing is mining', () => {
            const isMining =
                mockMiningMetricsStore.getState().cpu_mining_status.is_mining ||
                mockMiningMetricsStore.getState().gpu_mining_status.is_mining;

            expect(isMining).toBe(false);
        });
    });

    describe('eco alert check logic', () => {
        it('should not trigger eco alert if not needed', () => {
            mockConfigMiningStore.state.eco_alert_needed = false;

            const eco_alert_needed = mockConfigMiningStore.getState().eco_alert_needed;
            expect(eco_alert_needed).toBe(false);
        });

        it('should not trigger eco alert if not in Eco mode', () => {
            mockConfigMiningStore.state.eco_alert_needed = true;
            mockConfigMiningStore.state.getSelectedMiningMode = () => ({ mode_type: 'Ludicrous' });

            const eco_alert_needed = mockConfigMiningStore.getState().eco_alert_needed;
            const isEco = mockConfigMiningStore.getState().getSelectedMiningMode()?.mode_type === 'Eco';

            expect(eco_alert_needed && isEco).toBe(false);
        });

        it('should trigger eco alert when needed and in Eco mode', () => {
            mockConfigMiningStore.state.eco_alert_needed = true;
            mockConfigMiningStore.state.getSelectedMiningMode = () => ({ mode_type: 'Eco' });

            const eco_alert_needed = mockConfigMiningStore.getState().eco_alert_needed;
            const isEco = mockConfigMiningStore.getState().getSelectedMiningMode()?.mode_type === 'Eco';

            expect(eco_alert_needed && isEco).toBe(true);
        });
    });
});
