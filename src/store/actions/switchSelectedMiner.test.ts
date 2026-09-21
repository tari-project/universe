/**
 * @vitest-environment jsdom
 */
/**
 * Tests for switchSelectedMiner against the real store.
 *
 * The frontend moves `selectedMiner` before the backend has switched, and device ids are scoped
 * per miner, so the window between the two has to stay closed to anything that writes device
 * settings. `isSwitchingMiner` is what closes it, and these cover that it is raised for the whole
 * window and always lowered again.
 */
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

import { switchSelectedMiner } from './miningStoreActions.ts';
import { useMiningStore } from '../useMiningStore.ts';
import { GpuMinerType } from '@app/types/events-payloads.ts';

vi.hoisted(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ listen: vi.fn(), onCloseRequested: vi.fn() })),
}));
vi.mock('./appStateStoreActions.ts', () => ({ setError: vi.fn() }));

const mockedInvoke = vi.mocked(invoke);

describe('switchSelectedMiner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedInvoke.mockResolvedValue(undefined);
        useMiningStore.setState({
            selectedMiner: GpuMinerType.LolMiner,
            isSwitchingMiner: false,
            isCpuMiningInitiated: false,
            isGpuMiningInitiated: false,
        });
    });

    it('moves the selection and clears the in-flight flag once the backend has switched', async () => {
        await switchSelectedMiner(GpuMinerType.TariMiner);

        expect(mockedInvoke).toHaveBeenCalledWith('switch_gpu_miner', {
            gpuMinerType: GpuMinerType.TariMiner,
        });
        expect(useMiningStore.getState().selectedMiner).toBe(GpuMinerType.TariMiner);
        expect(useMiningStore.getState().isSwitchingMiner).toBe(false);
    });

    it('holds the in-flight flag for as long as the backend has not caught up', async () => {
        let flagWhileSwitching: boolean | undefined;
        mockedInvoke.mockImplementation(async () => {
            flagWhileSwitching = useMiningStore.getState().isSwitchingMiner;
        });

        await switchSelectedMiner(GpuMinerType.TariMiner);

        expect(flagWhileSwitching).toBe(true);
    });

    it('puts the selection back and clears the flag when the switch fails', async () => {
        mockedInvoke.mockRejectedValue('backend said no');

        await switchSelectedMiner(GpuMinerType.TariMiner);

        expect(useMiningStore.getState().selectedMiner).toBe(GpuMinerType.LolMiner);
        expect(useMiningStore.getState().isSwitchingMiner).toBe(false);
    });

    it('ignores a second switch while one is already in flight', async () => {
        useMiningStore.setState({ isSwitchingMiner: true });

        await switchSelectedMiner(GpuMinerType.TariMiner);

        expect(mockedInvoke).not.toHaveBeenCalled();
        expect(useMiningStore.getState().selectedMiner).toBe(GpuMinerType.LolMiner);
    });

    it('ignores a switch to the miner that is already selected', async () => {
        await switchSelectedMiner(GpuMinerType.LolMiner);

        expect(mockedInvoke).not.toHaveBeenCalled();
        expect(useMiningStore.getState().isSwitchingMiner).toBe(false);
    });
});
