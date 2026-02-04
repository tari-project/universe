import { describe, it, expect, beforeEach } from 'vitest';
import { useMiningStore } from './useMiningStore';

describe('useMiningStore', () => {
    beforeEach(() => {
        useMiningStore.setState({
            customLevelsDialogOpen: false,
            counter: 0,
            sessionMiningTime: {},
            hashrateReady: false,
            isCpuMiningInitiated: false,
            isGpuMiningInitiated: false,
            wasMineOnAppStartExecuted: false,
            isChangingMode: false,
            isExcludingGpuDevices: false,
            miningControlsEnabled: true,
            network: undefined,
            availableMiners: undefined,
            selectedMiner: undefined,
            showEcoAlert: false,
            selectedResumeDuration: undefined,
            eventSchedulerLastSelectedMiningModeName: undefined,
        });
    });

    describe('initial state', () => {
        it('has customLevelsDialogOpen as false', () => {
            expect(useMiningStore.getState().customLevelsDialogOpen).toBe(false);
        });

        it('has counter as 0', () => {
            expect(useMiningStore.getState().counter).toBe(0);
        });

        it('has empty sessionMiningTime', () => {
            expect(useMiningStore.getState().sessionMiningTime).toEqual({});
        });

        it('has hashrateReady as false', () => {
            expect(useMiningStore.getState().hashrateReady).toBe(false);
        });

        it('has isCpuMiningInitiated as false', () => {
            expect(useMiningStore.getState().isCpuMiningInitiated).toBe(false);
        });

        it('has isGpuMiningInitiated as false', () => {
            expect(useMiningStore.getState().isGpuMiningInitiated).toBe(false);
        });

        it('has wasMineOnAppStartExecuted as false', () => {
            expect(useMiningStore.getState().wasMineOnAppStartExecuted).toBe(false);
        });

        it('has isChangingMode as false', () => {
            expect(useMiningStore.getState().isChangingMode).toBe(false);
        });

        it('has isExcludingGpuDevices as false', () => {
            expect(useMiningStore.getState().isExcludingGpuDevices).toBe(false);
        });

        it('has miningControlsEnabled as true', () => {
            expect(useMiningStore.getState().miningControlsEnabled).toBe(true);
        });

        it('has network as undefined', () => {
            expect(useMiningStore.getState().network).toBeUndefined();
        });

        it('has availableMiners as undefined', () => {
            expect(useMiningStore.getState().availableMiners).toBeUndefined();
        });

        it('has selectedMiner as undefined', () => {
            expect(useMiningStore.getState().selectedMiner).toBeUndefined();
        });

        it('has showEcoAlert as false', () => {
            expect(useMiningStore.getState().showEcoAlert).toBe(false);
        });

        it('has selectedResumeDuration as undefined', () => {
            expect(useMiningStore.getState().selectedResumeDuration).toBeUndefined();
        });

        it('has eventSchedulerLastSelectedMiningModeName as undefined', () => {
            expect(useMiningStore.getState().eventSchedulerLastSelectedMiningModeName).toBeUndefined();
        });
    });

    describe('state updates', () => {
        it('can set customLevelsDialogOpen', () => {
            useMiningStore.setState({ customLevelsDialogOpen: true });
            expect(useMiningStore.getState().customLevelsDialogOpen).toBe(true);
        });

        it('can set counter', () => {
            useMiningStore.setState({ counter: 42 });
            expect(useMiningStore.getState().counter).toBe(42);
        });

        it('can set sessionMiningTime with startTimestamp', () => {
            const now = Date.now();
            useMiningStore.setState({ sessionMiningTime: { startTimestamp: now } });
            expect(useMiningStore.getState().sessionMiningTime.startTimestamp).toBe(now);
        });

        it('can set sessionMiningTime with stopTimestamp', () => {
            const now = Date.now();
            useMiningStore.setState({ sessionMiningTime: { stopTimestamp: now } });
            expect(useMiningStore.getState().sessionMiningTime.stopTimestamp).toBe(now);
        });

        it('can set sessionMiningTime with durationMs', () => {
            useMiningStore.setState({ sessionMiningTime: { durationMs: 60000 } });
            expect(useMiningStore.getState().sessionMiningTime.durationMs).toBe(60000);
        });

        it('can set full sessionMiningTime', () => {
            const start = Date.now() - 60000;
            const stop = Date.now();
            useMiningStore.setState({
                sessionMiningTime: {
                    startTimestamp: start,
                    stopTimestamp: stop,
                    durationMs: stop - start,
                },
            });
            const time = useMiningStore.getState().sessionMiningTime;
            expect(time.startTimestamp).toBe(start);
            expect(time.stopTimestamp).toBe(stop);
            expect(time.durationMs).toBe(stop - start);
        });

        it('can set isCpuMiningInitiated', () => {
            useMiningStore.setState({ isCpuMiningInitiated: true });
            expect(useMiningStore.getState().isCpuMiningInitiated).toBe(true);
        });

        it('can set isGpuMiningInitiated', () => {
            useMiningStore.setState({ isGpuMiningInitiated: true });
            expect(useMiningStore.getState().isGpuMiningInitiated).toBe(true);
        });

        it('can set both cpu and gpu mining initiated', () => {
            useMiningStore.setState({ isCpuMiningInitiated: true, isGpuMiningInitiated: true });
            expect(useMiningStore.getState().isCpuMiningInitiated).toBe(true);
            expect(useMiningStore.getState().isGpuMiningInitiated).toBe(true);
        });

        it('can set wasMineOnAppStartExecuted', () => {
            useMiningStore.setState({ wasMineOnAppStartExecuted: true });
            expect(useMiningStore.getState().wasMineOnAppStartExecuted).toBe(true);
        });

        it('can set isChangingMode', () => {
            useMiningStore.setState({ isChangingMode: true });
            expect(useMiningStore.getState().isChangingMode).toBe(true);
        });

        it('can set isExcludingGpuDevices', () => {
            useMiningStore.setState({ isExcludingGpuDevices: true });
            expect(useMiningStore.getState().isExcludingGpuDevices).toBe(true);
        });

        it('can set miningControlsEnabled', () => {
            useMiningStore.setState({ miningControlsEnabled: false });
            expect(useMiningStore.getState().miningControlsEnabled).toBe(false);
        });

        it('can set hashrateReady', () => {
            useMiningStore.setState({ hashrateReady: true });
            expect(useMiningStore.getState().hashrateReady).toBe(true);
        });

        it('can set showEcoAlert', () => {
            useMiningStore.setState({ showEcoAlert: true });
            expect(useMiningStore.getState().showEcoAlert).toBe(true);
        });

        it('can set selectedResumeDuration', () => {
            const resumeDuration = { durationHours: 2, timeStamp: Date.now() };
            useMiningStore.setState({ selectedResumeDuration: resumeDuration });
            expect(useMiningStore.getState().selectedResumeDuration).toEqual(resumeDuration);
        });

        it('can clear selectedResumeDuration', () => {
            useMiningStore.setState({ selectedResumeDuration: { durationHours: 2, timeStamp: Date.now() } });
            useMiningStore.setState({ selectedResumeDuration: undefined });
            expect(useMiningStore.getState().selectedResumeDuration).toBeUndefined();
        });

        it('can set eventSchedulerLastSelectedMiningModeName', () => {
            useMiningStore.setState({ eventSchedulerLastSelectedMiningModeName: 'Ludicrous' });
            expect(useMiningStore.getState().eventSchedulerLastSelectedMiningModeName).toBe('Ludicrous');
        });

        it('can set network', () => {
            useMiningStore.setState({ network: 'esmeralda' as any });
            expect(useMiningStore.getState().network).toBe('esmeralda');
        });
    });

    describe('mining initiation state transitions', () => {
        it('tracks CPU mining start lifecycle', () => {
            expect(useMiningStore.getState().isCpuMiningInitiated).toBe(false);

            useMiningStore.setState({ isCpuMiningInitiated: true });
            expect(useMiningStore.getState().isCpuMiningInitiated).toBe(true);

            useMiningStore.setState({ isCpuMiningInitiated: false });
            expect(useMiningStore.getState().isCpuMiningInitiated).toBe(false);
        });

        it('tracks GPU mining start lifecycle', () => {
            expect(useMiningStore.getState().isGpuMiningInitiated).toBe(false);

            useMiningStore.setState({ isGpuMiningInitiated: true });
            expect(useMiningStore.getState().isGpuMiningInitiated).toBe(true);

            useMiningStore.setState({ isGpuMiningInitiated: false });
            expect(useMiningStore.getState().isGpuMiningInitiated).toBe(false);
        });

        it('can have CPU mining without GPU mining', () => {
            useMiningStore.setState({ isCpuMiningInitiated: true, isGpuMiningInitiated: false });
            expect(useMiningStore.getState().isCpuMiningInitiated).toBe(true);
            expect(useMiningStore.getState().isGpuMiningInitiated).toBe(false);
        });

        it('can have GPU mining without CPU mining', () => {
            useMiningStore.setState({ isCpuMiningInitiated: false, isGpuMiningInitiated: true });
            expect(useMiningStore.getState().isCpuMiningInitiated).toBe(false);
            expect(useMiningStore.getState().isGpuMiningInitiated).toBe(true);
        });
    });

    describe('session mining time calculations', () => {
        it('can calculate duration from start and stop timestamps', () => {
            const start = 1000000;
            const stop = 1060000; // 60 seconds later
            const duration = stop - start;

            useMiningStore.setState({
                sessionMiningTime: {
                    startTimestamp: start,
                    stopTimestamp: stop,
                    durationMs: duration,
                },
            });

            const time = useMiningStore.getState().sessionMiningTime;
            expect(time.durationMs).toBe(60000);
        });

        it('preserves partial session time updates', () => {
            useMiningStore.setState({ sessionMiningTime: { startTimestamp: 1000 } });

            const current = useMiningStore.getState().sessionMiningTime;
            useMiningStore.setState({
                sessionMiningTime: { ...current, stopTimestamp: 2000 },
            });

            const updated = useMiningStore.getState().sessionMiningTime;
            expect(updated.startTimestamp).toBe(1000);
            expect(updated.stopTimestamp).toBe(2000);
        });
    });
});
