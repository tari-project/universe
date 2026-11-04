import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockInvoke = vi.fn().mockResolvedValue(undefined);

vi.mock('@tauri-apps/api/core', () => ({
    invoke: (...args: unknown[]) => mockInvoke(...args),
}));

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: () => ({
        isMinimized: vi.fn().mockResolvedValue(false),
    }),
}));

vi.mock('@tari-project/tari-tower', () => ({
    setAnimationState: vi.fn(),
}));

import { setCpuMiningStatus, setGpuDevices, setGpuMiningStatus } from './miningMetricsStoreActions';
import { setCpuPoolStats, setGpuPoolStats } from './miningPoolsStoreActions';
import { handleBaseNodeStatusUpdate } from './nodeStoreActions';
import { mergeTransactions } from './helpers';
import { useMiningMetricsStore } from '../useMiningMetricsStore';
import { useMiningPoolsStore } from '../useMiningPoolsStore';
import { useConfigPoolsStore } from '../useAppConfigStore';
import { CpuPools, GpuPools } from '@app/types/configs';
import { useNodeStore } from '../useNodeStore';
import { updateWalletScanningProgress, useWalletStore } from '../useWalletStore';
import setupLogger from '@app/utils/shared-logger';
import type { BaseNodeStatus, DisplayedTransaction, PoolStats } from '@app/types/app-status';

describe('store equality and render cost fixes (#3373)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useMiningMetricsStore.setState({
            gpu_devices: [],
            gpu_mining_status: {
                is_mining: false,
                hash_rate: 0,
                estimated_earnings: 0,
                is_available: true,
            },
            cpu_mining_status: {
                is_mining: false,
                hash_rate: 0,
                estimated_earnings: 0,
                connection: { is_connected: false },
            },
        });
    });

    it('preserves store references in miningMetricsStoreActions when payload is unchanged', () => {
        const prevCpu = useMiningMetricsStore.getState().cpu_mining_status;
        setCpuMiningStatus({
            is_mining: false,
            hash_rate: 0,
            estimated_earnings: 0,
            connection: { is_connected: false },
        });
        expect(useMiningMetricsStore.getState().cpu_mining_status).toBe(prevCpu);

        const prevGpu = useMiningMetricsStore.getState().gpu_mining_status;
        setGpuMiningStatus({
            is_mining: false,
            hash_rate: 0,
            estimated_earnings: 0,
            is_available: true,
        });
        expect(useMiningMetricsStore.getState().gpu_mining_status).toBe(prevGpu);

        const prevDevices = useMiningMetricsStore.getState().gpu_devices;
        setGpuDevices([]);
        expect(useMiningMetricsStore.getState().gpu_devices).toBe(prevDevices);
    });

    it('does not rebuild cpuRewards or gpuRewards when pool stats are unchanged and rewardValue is 0', () => {
        const stats: PoolStats = {
            accepted_shares: 10,
            unpaid: 500_000,
            balance: 100_000,
            min_payout: 2_000_000,
        };
        useConfigPoolsStore.setState({
            current_cpu_pool: CpuPools.LuckyPoolRandomX,
            current_gpu_pool: GpuPools.LuckyPoolC29,
        });

        setCpuPoolStats({ [CpuPools.LuckyPoolRandomX]: stats });
        const firstCpuState = useMiningPoolsStore.getState();
        const firstCpuRewards = firstCpuState.cpuRewards;

        setCpuPoolStats({ [CpuPools.LuckyPoolRandomX]: { ...stats } });
        expect(useMiningPoolsStore.getState()).toBe(firstCpuState);
        expect(useMiningPoolsStore.getState().cpuRewards).toBe(firstCpuRewards);

        setGpuPoolStats({ [GpuPools.LuckyPoolC29]: stats });
        const firstGpuState = useMiningPoolsStore.getState();
        const firstGpuRewards = firstGpuState.gpuRewards;

        setGpuPoolStats({ [GpuPools.LuckyPoolC29]: { ...stats } });
        expect(useMiningPoolsStore.getState()).toBe(firstGpuState);
        expect(useMiningPoolsStore.getState().gpuRewards).toBe(firstGpuRewards);
    });

    it('preserves base_node_status reference when handleBaseNodeStatusUpdate receives identical status', () => {
        const status: BaseNodeStatus = {
            sha_network_hashrate: 1000,
            monero_randomx_network_hashrate: 2000,
            tari_randomx_network_hashrate: 3000,
            block_reward: 5000,
            block_height: 100,
            block_time: 120,
            is_synced: true,
            num_connections: 4,
            readiness_status: 'Ready',
        };
        handleBaseNodeStatusUpdate(status);
        const firstState = useNodeStore.getState();

        handleBaseNodeStatusUpdate({ ...status });
        expect(useNodeStore.getState()).toBe(firstState);
        expect(useNodeStore.getState().base_node_status).toBe(firstState.base_node_status);
    });

    it('preserves wallet_scanning reference when updateWalletScanningProgress receives identical progress', () => {
        const progress = {
            scanned_height: 500,
            total_height: 500,
            progress: 100,
            is_initial_scan_complete: true,
        };
        updateWalletScanningProgress(progress);
        const firstScanning = useWalletStore.getState().wallet_scanning;

        updateWalletScanningProgress({ ...progress });
        expect(useWalletStore.getState().wallet_scanning).toBe(firstScanning);
    });

    it('skips re-sorting and preserves array reference in mergeTransactions when an update makes no change', () => {
        const txA = {
            id: 1,
            amount: 100,
            blockchain: { timestamp: '2026-01-02T00:00:00Z' },
        } as unknown as DisplayedTransaction;
        const txB = {
            id: 2,
            amount: 200,
            blockchain: { timestamp: '2026-01-01T00:00:00Z' },
        } as unknown as DisplayedTransaction;

        const current = [txA, txB];
        const unchanged = mergeTransactions(current, [{ ...txA }], false);
        expect(unchanged).toBe(current);

        const updatedAmount = mergeTransactions(current, [{ ...txA, amount: 150 }], false);
        expect(updatedAmount).not.toBe(current);
        expect(updatedAmount[0].amount).toBe(150);
        expect(updatedAmount[1]).toBe(txB);
    });

    it('serializes strings and objects compactly in shared-logger without multi-line indentation', () => {
        const origInfo = console.info;
        try {
            setupLogger();
            console.info('plain message', { a: 1, b: 2 });
            expect(mockInvoke).toHaveBeenCalledWith('log_web_message', {
                level: 'info',
                message: [expect.anything(), 'plain message', '{"a":1,"b":2}'],
            });
        } finally {
            console.info = origInfo;
        }
    });
});
